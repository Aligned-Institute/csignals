import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { persona, flow } = body;

        if (!persona || !flow) {
            return NextResponse.json({ error: 'Missing persona or flow data' }, { status: 400 });
        }

        // Generate Structured Markdown Analysis Document
        const date = new Date().toISOString().split('T')[0];
        const titlePersona = persona === 'investor' ? 'Investor' : 'Enterprise';

        let markdown = `# Sage Analysis Document: ${titlePersona} Perspective\n`;
        markdown += `*Generated on: ${date}*\n\n`;

        flow.forEach((item: any, index: number) => {
            markdown += `## ${index + 1}. ${item.pillar}\n`;
            markdown += `**Q:** ${item.question}\n\n`;
            markdown += `**A:** ${item.response || 'No response provided.'}\n\n`;
        });

        markdown += `---\n*Analysis completed via ASI Signals Sage Interface.*\n`;

        // Simulate backend processing delay
        await new Promise(res => setTimeout(res, 1500));

        // Here we would typically save `markdown` to the user's portfolio via the actual backend DB API, e.g.:
        // await fetch(`${process.env.API_URL}/api/v1/signal/portfolio/document`, { ... })

        return NextResponse.json({
            success: true,
            message: 'Analysis generated successfully',
            data: { markdown }
        });
    } catch (error) {
        console.error("Sage Generation Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
