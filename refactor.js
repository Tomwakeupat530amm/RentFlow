const fs = require('fs');
const path = require('path');

const pages = [
    { dir: 'src/app/portal/dashboard', name: 'Dashboard' },
    { dir: 'src/app/portal/invoices', name: 'Invoices' },
    { dir: 'src/app/portal/invoices/[id]', name: 'InvoiceDetail' },
    { dir: 'src/app/portal/incidents', name: 'Incidents' },
    { dir: 'src/app/portal/profile', name: 'Profile' }
];

pages.forEach(({dir, name}) => {
    const pagePath = path.join(dir, 'page.tsx');
    if (!fs.existsSync(pagePath)) return;
    
    let content = fs.readFileSync(pagePath, 'utf8');
    if (content.includes('use client')) return;
    if (content.includes(name + 'Client')) return; 
    
    const returnIndex = content.indexOf('return (');
    if (returnIndex === -1) return;
    
    let imports = '';
    const importMatches = content.match(/import .* from .*/g);
    if (importMatches) {
        imports = importMatches.join('\n');
    }
    
    let pageImports = imports
        .split('\n')
        .filter(i => !i.includes('antd') && !i.includes('@ant-design/icons') && !i.includes('next/link'))
        .join('\n');
        
    let clientImports = imports
        .split('\n')
        .filter(i => !i.includes('@/lib/tenant-auth') && !i.includes('@/lib/supabase/admin'))
        .join('\n');
        
    const bodyMatch = content.match(/export default async function [^{]+\{\n([\s\S]*?)return \(/);
    if (!bodyMatch) return;
    const body = bodyMatch[1];
    
    const props = [];
    
    const lines = body.split('\n');
    lines.forEach(line => {
        const m1 = line.match(/const\s+\{\s*data:\s*([a-zA-Z0-9_]+)\s*\}/);
        if (m1) props.push(m1[1]);
        const m2 = line.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*await/);
        if (m2) props.push(m2[1]);
        const m3 = line.match(/let\s+([a-zA-Z0-9_]+)\s*=/);
        if (m3) props.push(m3[1]);
    });
    
    if (!props.includes('session') && body.includes('session')) props.push('session');
    
    let clientCode = "'use client';\n\n" + clientImports + "\n\n";
    clientCode += "export default function " + name + "Client({ " + props.join(', ') + " }: any) {\n";
    
    const returnBlock = content.substring(returnIndex);
    clientCode += '    ' + returnBlock;
    
    fs.writeFileSync(path.join(dir, name + 'Client.tsx'), clientCode);
    
    let pageCode = pageImports + "\nimport " + name + "Client from './" + name + "Client';\n\n";
    pageCode += "export default async function " + name + "Page({ params }: any) {\n";
    // params needs to be awaited in Next.js 15
    if (body.includes('params.id')) {
        pageCode += "    const { id } = await params;\n";
    }
    pageCode += body;
    pageCode += "    return <" + name + "Client " + props.map(p => p + '={' + p + '}').join(' ') + " />;\n}\n";
    
    fs.writeFileSync(pagePath, pageCode);
    console.log('Refactored ' + name);
});
