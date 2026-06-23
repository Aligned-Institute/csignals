import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = '/Users/warmachine/Documents/PROJECTS/ALI/2-Labs/Research/csignals/data/PET_PRI_SPT_S1_D.xls';
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Sample dataset file not found on server disk.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': 'attachment; filename="PET_PRI_SPT_S1_D.xls"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
