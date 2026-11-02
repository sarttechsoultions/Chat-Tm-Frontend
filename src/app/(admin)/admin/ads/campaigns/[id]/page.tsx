import AdminCampaignDetail from "../../../../../../components/admin/AdminCampaignDetail";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AdminCampaignDetail id={id}/>;}
