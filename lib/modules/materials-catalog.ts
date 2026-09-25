import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type CatalogMaterial = {
  id: string; organization_id: string; name: string; category: string;
  unit: string; unit_cost_cents: number; vendor: string | null;
};
export type Recipe = {
  id: string; name: string; description: string | null; labor_cost_cents: number;
};
export type RecipeIngredient = {
  id: string; recipe_id: string; material_id: string | null; description: string;
  quantity_per_unit: number; unit: string; unit_cost_cents: number;
  vendor: string | null; position: number;
};
export type MaterialLibrary = {
  materials: CatalogMaterial[]; recipes: Recipe[]; ingredients: RecipeIngredient[];
};
const asCents = (lei: number) => Math.round(lei * 100);
const amount = (lei: number) => Number.isFinite(lei) && lei >= 0 && Number.isSafeInteger(asCents(lei));
const positive = (qty: number) => Number.isFinite(qty) && qty > 0 && qty <= 1000000;

export async function loadMaterialLibrary(organizationId: string): Promise<MaterialLibrary> {
  if (!organizationId.trim()) throw new Error("Firma este obligatorie.");
  const [materials, recipes, ingredients] = await Promise.all([
    orbyvenSupabase.from("ops_material_catalog")
      .select("id,organization_id,name,category,unit,unit_cost_cents,vendor")
      .eq("organization_id",organizationId).order("name"),
    orbyvenSupabase.from("ops_material_recipes")
      .select("id,name,description,labor_cost_cents")
      .eq("organization_id",organizationId).order("name"),
    orbyvenSupabase.from("ops_material_recipe_items")
      .select("id,recipe_id,material_id,description,quantity_per_unit,unit,unit_cost_cents,vendor,position")
      .eq("organization_id",organizationId).order("position").order("created_at"),
  ]);
  for (const result of [materials,recipes,ingredients]) if(result.error) throw result.error;
  return {
    materials:(materials.data??[]) as CatalogMaterial[],
    recipes:(recipes.data??[]) as Recipe[],
    ingredients:(ingredients.data??[]) as RecipeIngredient[],
  };
}

export async function createCatalogMaterial(organizationId:string,input:{
  name:string;category:string;unit:string;costLei:number;vendor:string;
}):Promise<void>{
  const name=input.name.trim(),category=input.category.trim()||"general",unit=input.unit.trim();
  if (!organizationId || !name || !unit || !amount(input.costLei)) throw new Error("Verifică numele, unitatea și costul materialului.");
  const {data}=await orbyvenSupabase.auth.getUser();
  const result=await orbyvenSupabase.from("ops_material_catalog").insert({
    organization_id:organizationId,name,category,unit,unit_cost_cents:asCents(input.costLei),
    vendor:input.vendor.trim()||null,created_by:data.user?.id??null,
  });
  if (result.error?.code==="23505") throw new Error("Materialul există deja cu aceeași unitate.");
  if (result.error) throw result.error;
}

export async function updateCatalogMaterial(organizationId:string,id:string,input:{
  costLei:number;vendor:string;
}):Promise<void>{
  if(!organizationId||!id||!amount(input.costLei))throw new Error("Cost invalid.");
  const {data,error}=await orbyvenSupabase.from("ops_material_catalog").update({
    unit_cost_cents:asCents(input.costLei),vendor:input.vendor.trim()||null,
  }).eq("organization_id",organizationId).eq("id",id).select("id").single();
  if(error||!data)throw error??new Error("Materialul nu este disponibil în această firmă.");
}

export async function createMaterialRecipe(organizationId:string,input:{
  name:string;description:string;laborLei:number;
}):Promise<void>{
  if(!organizationId||!input.name.trim()||!amount(input.laborLei))throw new Error("Verifică rețeta și costul manoperei.");
  const {data}=await orbyvenSupabase.auth.getUser();
  const {error}=await orbyvenSupabase.from("ops_material_recipes").insert({
    organization_id:organizationId,name:input.name.trim(),description:input.description.trim()||null,
    labor_cost_cents:asCents(input.laborLei),created_by:data.user?.id??null,
  });
  if(error)throw error;
}

export async function updateRecipeLabor(organizationId:string,id:string,laborLei:number):Promise<void>{
  if(!organizationId||!id||!amount(laborLei))throw new Error("Costul manoperei nu este valid.");
  const {data,error}=await orbyvenSupabase.from("ops_material_recipes")
    .update({labor_cost_cents:asCents(laborLei)}).eq("organization_id",organizationId)
    .eq("id",id).select("id").single();
  if(error||!data)throw error??new Error("Rețeta nu este disponibilă.");
}

export async function addRecipeMaterial(organizationId:string,recipeId:string,materialId:string,perUnit:number):Promise<void>{
  if(!organizationId||!recipeId||!materialId||!positive(perUnit))throw new Error("Alege materialul și consumul pe unitate.");
  const [recipe,material,prior]=await Promise.all([
    orbyvenSupabase.from("ops_material_recipes").select("id").eq("organization_id",organizationId).eq("id",recipeId).single(),
    orbyvenSupabase.from("ops_material_catalog")
      .select("id,name,unit,unit_cost_cents,vendor").eq("organization_id",organizationId).eq("id",materialId).single(),
    orbyvenSupabase.from("ops_material_recipe_items")
      .select("id").eq("organization_id",organizationId).eq("recipe_id",recipeId).eq("material_id",materialId).limit(1),
  ]);
  if(recipe.error||!recipe.data||material.error||!material.data||prior.error)throw new Error("Rețeta sau materialul nu aparțin firmei.");
  if(prior.data?.length)throw new Error("Materialul este deja în rețetă.");
  const {data}=await orbyvenSupabase.auth.getUser();
  const {error}=await orbyvenSupabase.from("ops_material_recipe_items").insert({
    organization_id:organizationId,recipe_id:recipeId,material_id:materialId,
    description:material.data.name,unit:material.data.unit,
    unit_cost_cents:material.data.unit_cost_cents,vendor:material.data.vendor,
    quantity_per_unit:perUnit,position:0,created_by:data.user?.id??null,
  });
  if(error)throw error;
}

export function recipeCost(recipeId:string,library:MaterialLibrary):number{
  const ingredientRows=library.ingredients.filter(row=>row.recipe_id===recipeId);
  return ingredientRows.reduce((sum,row)=>{
    const currentMaterial=library.materials.find(material=>material.id===row.material_id);
    return sum + Math.round(row.quantity_per_unit*(currentMaterial?.unit_cost_cents??row.unit_cost_cents));
  },0);
}

export function recipeEstimatePreview(recipeId:string,qty:number,unitSaleLei:number,library:MaterialLibrary){
  const recipe=library.recipes.find(r=>r.id===recipeId);
  if(!recipe||!positive(qty)||!amount(unitSaleLei))throw new Error("Selectează rețeta, cantitatea și prețul de vânzare.");
  const unitMaterialCost=recipeCost(recipe.id,library),laborCents=recipe.labor_cost_cents;
  const saleCents=asCents(unitSaleLei);
  return {
    description:recipe.name,
    quantity:qty,
    unitPriceLei:unitSaleLei,
    unitMaterialCostCents:unitMaterialCost,
    estimatedMaterialsCents:Math.round(qty*unitMaterialCost),
    estimatedLaborCents:Math.round(qty*laborCents),
    estimatedMarginCents:Math.round(qty*(saleCents-unitMaterialCost-laborCents)),
  };
}
