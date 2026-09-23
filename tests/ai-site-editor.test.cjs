const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const root=process.cwd();
function compile(path){const result=ts.transpileModule(fs.readFileSync(root+"/"+path,"utf8"),{fileName:path,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});assert.equal((result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);return result.outputText;}
const draftModule={exports:{}};
vm.runInNewContext(compile("lib/ai/site-editor.ts"),{module:draftModule,exports:draftModule.exports});
const {DEFAULT_SITE,readSiteDraft,applySitePatch}=draftModule.exports;
const org="11111111-1111-4111-8111-111111111111";
function route(opts={}){
  const calls=[];const exports={};const module={exports};
  const env={ORBYVEN_AI_EDITOR_ENABLED:"true",OPENAI_API_KEY:"test-placeholder",...opts.env};
  vm.runInNewContext(compile("app/api/ai/site-editor/route.ts"),{
    exports,module,process:{env},Number,JSON,Array,Request,
    require(name){
      if(name==="next/server")return{NextResponse:{json:(v,init={})=>({status:init.status||200,json:async()=>v})}};
      if(name==="@/lib/billing/supabase-server")return{authenticateBillingActor:async(...args)=>{calls.push(["auth",...args]);if(opts.deny)throw Error("ORG_ACCESS_REQUIRED");}};
      if(name==="@/lib/ai/site-editor")return{readSiteDraft};
      if(name==="@/lib/ai/openai-server")return{suggestSiteEdit:async(...args)=>{calls.push(["ai",...args]);return{draft:applySitePatch(args[0],{headline:"Titlu nou"}),message:"Gata."};}};
      throw Error(name);
    }
  });
  return{calls,post:(body)=>module.exports.POST(new Request("https://example.invalid/api/ai/site-editor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}))};
}
const good={organizationId:org,prompt:"Schimbă titlul",draft:DEFAULT_SITE};
test("contract: rejects unknown colors",()=>{assert.equal(readSiteDraft(DEFAULT_SITE).brand,DEFAULT_SITE.brand);assert.equal(readSiteDraft({...DEFAULT_SITE,accent:"red"}),null);});
test("contract: invalid text and color never enter preview",()=>{const x=applySitePatch(DEFAULT_SITE,{headline:"x".repeat(500),background:"url(javascript:bad)",cta:"Salut"});assert.equal(x.headline,DEFAULT_SITE.headline);assert.equal(x.background,DEFAULT_SITE.background);assert.equal(x.cta,"Salut");});
test("default-disabled endpoint calls neither auth nor AI",async()=>{const a=route({env:{ORBYVEN_AI_EDITOR_ENABLED:"false"}});assert.equal((await a.post(good)).status,503);assert.equal(a.calls.length,0);});
test("invalid organization rejected before external call",async()=>{const a=route();assert.equal((await a.post({...good,organizationId:""})).status,400);assert.equal(a.calls.length,0);});
test("different/unauthorized tenant never invokes AI",async()=>{const a=route({deny:true});assert.equal((await a.post(good)).status,403);assert.equal(a.calls.filter(x=>x[0]==="ai").length,0);});
test("authorized owner/admin reaches model with scoped org",async()=>{const a=route();const res=await a.post(good);assert.equal(res.status,200);assert.equal((await res.json()).draft.headline,"Titlu nou");assert.equal(a.calls[0][2],org);assert.equal(a.calls[0][3],true);assert.equal(a.calls.filter(x=>x[0]==="ai").length,1);});
test("client and server editor files parse as TypeScript",()=>{for(const p of ["lib/ai/openai-server.ts","lib/ai/use-site-editor.ts","components/ai/SiteEditorChat.tsx","components/ai/SiteEditorPreview.tsx","app/workspace/site-editor/page.tsx"])assert.ok(compile(p).length>0);});
