"use client";

import {useState,type FormEvent} from "react";
import type {OrbyvenWorkspace} from "@/lib/orbyven-workspace";
import {
  addRecipeMaterial,createCatalogMaterial,createMaterialRecipe,updateCatalogMaterial,
  updateRecipeLabor,type MaterialLibrary,
} from "@/lib/modules/materials-catalog";

const input="h-9 min-w-0 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 text-[12px] text-[var(--text)] outline-none focus:border-[var(--accent)]";
const button="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold transition hover:border-[var(--accent)] disabled:opacity-40";
const lei=(cents:number)=>new Intl.NumberFormat("ro-RO",{style:"currency",currency:"RON"}).format(cents/100);
export default function MaterialsLibraryPanel({organizationId,role,library,onChanged}:{
  organizationId:string;role:OrbyvenWorkspace["membership"]["role"];
  library:MaterialLibrary;onChanged:()=>Promise<void>;
}){
  const [expanded,setExpanded]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [name,setName]=useState("");
  const [unit,setUnit]=useState("buc");
  const [category,setCategory]=useState("general");
  const [vendor,setVendor]=useState("");
  const [price,setPrice]=useState("");
  const [recipeName,setRecipeName]=useState("");
  const [recipeDescription,setRecipeDescription]=useState("");
  const [recipeLabor,setRecipeLabor]=useState("0");
  const [recipeId,setRecipeId]=useState("");
  const [materialId,setMaterialId]=useState("");
  const [perUnit,setPerUnit]=useState("1");
  const canWrite=role!=="viewer";
  const activeRecipe=library.recipes.find(row=>row.id===recipeId);
  const show=async(operation:()=>Promise<unknown>,message:string):Promise<boolean>=>{
    if(busy||!canWrite)return false;
    setBusy(true);setError("");setNotice("");
    try{await operation();await onChanged();setNotice(message);return true;}
    catch(reason){setError(reason instanceof Error?reason.message:"Nu s-a putut salva.");return false;}
    finally{setBusy(false);}
  };
  const createMaterial=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(await show(()=>createCatalogMaterial(organizationId,{name,unit,category,vendor,costLei:Number(price)}),"Material salvat în biblioteca firmei.")){setName("");setPrice("");setVendor("");}
  };
  const createRecipe=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    let createdId="";
    if(await show(async()=>{createdId=await createMaterialRecipe(organizationId,{name:recipeName,description:recipeDescription,laborLei:Number(recipeLabor)});},"Rețetă creată. Adaugă materialele și consumul.")){
      setRecipeId(createdId);setRecipeName("");setRecipeDescription("");setRecipeLabor("0");
    }
  };
  const addIngredient=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(await show(()=>addRecipeMaterial(organizationId,recipeId,materialId,Number(perUnit)),"Material adăugat la rețetă.")){
      setMaterialId("");setPerUnit("1");
    }
  };
  return <section className="mt-5 rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:p-5" aria-label="Biblioteca firmei">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">ORBYVEN · MATERIALS</p>
        <h2 className="mt-1 text-[16px] font-semibold">Materiale & rețete</h2>
        <p className="mt-1 text-[11px] text-[var(--muted)]">{library.materials.length} materiale · {library.recipes.length} rețete în firma ta</p>
      </div>
      <button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} className={button}>{expanded?"Închide biblioteca":"Deschide biblioteca →"}</button>
    </div>
    {expanded&&<div className="mt-4 grid gap-3 xl:grid-cols-2">
      {error&&<p role="alert" className="xl:col-span-2 rounded-[10px] border border-rose-400/30 p-3 text-xs text-rose-300">{error}</p>}
      {notice&&<p role="status" className="xl:col-span-2 rounded-[10px] border border-emerald-400/30 p-3 text-xs text-emerald-300">{notice}</p>}
      <div className="min-w-0 rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">
        <h3 className="text-[12px] font-semibold">Bibliotecă materiale</h3>
        <p className="mt-1 text-[10px] text-[var(--muted)]">Prețurile noi se aplică la calculele viitoare; devizele salvate rămân nemodificate.</p>
        <div className="mt-3 max-h-[330px] space-y-2 overflow-y-auto">
          {library.materials.map(row=><div key={row.id} className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2"><span className="min-w-0 truncate text-[12px] font-semibold">{row.name}</span><span className="text-[10px] text-[var(--muted)]">{row.unit}</span></div>
            <div className="mt-1 text-[10px] text-[var(--muted)]">{row.category} · {lei(row.unit_cost_cents)} / {row.unit}</div>
            {canWrite&&<div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-[10px] text-[var(--muted)]">Cost/unitate (lei)
                <input type="number" aria-label={"Cost "+row.name} min="0" step="0.01" defaultValue={String(row.unit_cost_cents/100)} key={row.id+row.unit_cost_cents} className={input} onBlur={event=>{
                  const value=Number(event.target.value);
                  if(Number.isFinite(value)&&Math.round(value*100)!==row.unit_cost_cents)
                    void show(()=>updateCatalogMaterial(organizationId,row.id,{costLei:value,vendor:row.vendor??""}),"Costul a fost actualizat.");
                }}/></label>
              <label className="text-[10px] text-[var(--muted)]">Furnizor
                <input aria-label={"Furnizor "+row.name} defaultValue={row.vendor??""} key={row.id+"vendor"+row.vendor} className={input} onBlur={event=>{
                  if(event.target.value.trim()!==(row.vendor??""))
                    void show(()=>updateCatalogMaterial(organizationId,row.id,{costLei:row.unit_cost_cents/100,vendor:event.target.value}),"Furnizor actualizat.");
                }}/></label>
            </div>}
          </div>)}
          {!library.materials.length&&<p className="py-4 text-[11px] text-[var(--muted)]">Adaugă primul material. Biblioteca este goală.</p>}
        </div>
        {canWrite&&<form onSubmit={event=>void createMaterial(event)} className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 sm:grid-cols-2">
          <input required placeholder="Material nou" value={name} onChange={e=>setName(e.target.value)} aria-label="Denumire material" className={input+" sm:col-span-2"}/>
          <input required placeholder="Unitate (buc, m, m²)" value={unit} onChange={e=>setUnit(e.target.value)} aria-label="Unitate material" className={input}/>
          <input required type="number" min="0" step="0.01" placeholder="Cost (lei)" value={price} onChange={e=>setPrice(e.target.value)} aria-label="Cost material" className={input}/>
          <input placeholder="Categorie" value={category} onChange={e=>setCategory(e.target.value)} aria-label="Categorie material" className={input}/>
          <input placeholder="Furnizor" value={vendor} onChange={e=>setVendor(e.target.value)} aria-label="Furnizor material" className={input}/>
          <button disabled={busy} className={button+" sm:col-span-2"}>+ Salvează material</button>
        </form>}
      </div>
      <div className="min-w-0 rounded-[13px] border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">
        <h3 className="text-[12px] font-semibold">Rețete reutilizabile</h3>
        <p className="mt-1 text-[10px] text-[var(--muted)]">Consumul și manopera sunt definite pe unitate de lucrare.</p>
        <div className="mt-3 max-h-[330px] space-y-2 overflow-y-auto">{library.recipes.map(recipe=><button key={recipe.id} type="button" onClick={()=>setRecipeId(recipe.id)} className={"w-full rounded-[10px] border px-3 py-2 text-left "+(recipeId===recipe.id?"border-[var(--accent)] bg-[var(--accent-soft)]":"border-[var(--border)] bg-[var(--surface)]")}>
          <span className="block text-xs font-semibold">{recipe.name}</span>
          <span className="mt-1 block text-[10px] text-[var(--muted)]">{library.ingredients.filter(i=>i.recipe_id===recipe.id).length} materiale · manoperă {lei(recipe.labor_cost_cents)}/unitate</span>
        </button>)}
        {!library.recipes.length&&<p className="py-4 text-[11px] text-[var(--muted)]">Nu ai încă rețete.</p>}</div>
        {activeRecipe&&<div className="mt-3 rounded-[11px] border border-[var(--border-strong)] bg-[var(--surface)] p-3">
          <p className="text-[11px] font-semibold">{activeRecipe.name}</p>
          {library.ingredients.filter(i=>i.recipe_id===activeRecipe.id).map(i=><p key={i.id} className="mt-1 text-[11px] text-[var(--muted)]">{i.description} · {i.quantity_per_unit} {i.unit}/unitate</p>)}
          {canWrite&&<div className="mt-3">
            <label className="text-[10px] text-[var(--muted)]">Manoperă/unitate (lei)
              <input type="number" min="0" step="0.01" key={activeRecipe.id+activeRecipe.labor_cost_cents} defaultValue={activeRecipe.labor_cost_cents/100} className={input} onBlur={e=>{
                const value=Number(e.target.value);
                if(Number.isFinite(value)&&Math.round(value*100)!==activeRecipe.labor_cost_cents)
                  void show(()=>updateRecipeLabor(organizationId,activeRecipe.id,value),"Manopera rețetei a fost actualizată.");
              }}/></label>
          </div>}
          {canWrite&&library.materials.length>0&&<form onSubmit={event=>void addIngredient(event)} className="mt-3 grid gap-2">
            <select required aria-label="Material pentru rețetă" value={materialId} onChange={e=>setMaterialId(e.target.value)} className={input}>
              <option value="">Alege materialul</option>
              {library.materials.map(m=><option key={m.id} value={m.id}>{m.name} · {m.unit}</option>)}
            </select>
            <input required type="number" min="0.001" step="any" aria-label="Consum pe unitate de lucrare" value={perUnit} onChange={e=>setPerUnit(e.target.value)} className={input}/>
            <button disabled={busy||!materialId} className={button}>+ Adaugă în rețetă</button>
          </form>}
        </div>}
        {canWrite&&<form onSubmit={event=>void createRecipe(event)} className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3">
          <p className="text-[11px] font-semibold">Rețetă nouă</p>
          <input required placeholder="Ex. Încălzire în pardoseală / m²" value={recipeName} onChange={e=>setRecipeName(e.target.value)} className={input}/>
          <input placeholder="Descriere (opțional)" value={recipeDescription} onChange={e=>setRecipeDescription(e.target.value)} className={input}/>
          <label className="text-[10px] text-[var(--muted)]">Manoperă/unitate (lei)<input required type="number" min="0" step="0.01" value={recipeLabor} onChange={e=>setRecipeLabor(e.target.value)} className={input}/></label>
          <button disabled={busy} className={button}>+ Creează rețeta</button>
        </form>}
      </div>
    </div>}
  </section>;
}
