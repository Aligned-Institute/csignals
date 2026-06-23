export const J_FLOW = [
    {
        id: "j1",
        question: "How structurally exposed is the target chemical asset to key raw material aromatic feedstocks (benzene, propylene, ethylene) and energy cost spikes?",
        pillar: "Feedstock Risk"
    },
    {
        id: "j2",
        question: "What is the historical EBITDA margin volatility of the asset during global supply disruptions (e.g. Red Sea shipping crisis, domestic freeze events)?",
        pillar: "Margin Resilience"
    },
    {
        id: "j3",
        question: "What is the target's competitive position on the global industry cost curve compared to low-cost imports from East Asia?",
        pillar: "Global Cost Position"
    },
    {
        id: "j4",
        question: "What proportion of their contract portfolio utilizes index-based pricing (WTI, natural gas) vs. value-in-use spot negotiations?",
        pillar: "Pricing Structure"
    },
    {
        id: "j5",
        question: "Does the management team possess verified track records in chemical operations, downstream formulations, and plant safety (OSHA compliance)?",
        pillar: "Operating Track Record"
    },
    {
        id: "j6",
        question: "Who is the primary competitor in this chemical derivative cluster (e.g., BASF, Covestro for MDI) and why is the target's process chemistry superior?",
        pillar: "Competitive Landscape"
    },
    {
        id: "j7",
        question: "What production capacity expansions, debottlenecking projects, or environmental upgrades are scheduled for the next 12-18 months?",
        pillar: "Asset Milestones"
    },
    {
        id: "j8",
        question: "What logistics vulnerabilities exist (railcar bottlenecks, barge availability, pipeline dependency) and how are they being mitigated?",
        pillar: "Logistics Resilience"
    },
    {
        id: "j9",
        question: "How will the target allocate capital expenditures between maintenance capex, capacity growth, and decarbonization (Scope 1/2 reduction)?",
        pillar: "Capital Allocation"
    },
    {
        id: "j10",
        question: "How vulnerable is the target's downstream end-market demand (e.g. residential insulation construction, automotive coatings) to cyclical economic downturns?",
        pillar: "End-Market Risk"
    }
];

export const E_FLOW = [
    {
        id: "e1",
        question: "What is the supplier's primary pipeline connectivity, total storage capacity, and backup railcar/barge logistics to mitigate force majeure risks?",
        pillar: "Supply Security"
    },
    {
        id: "e2",
        question: "Does the supplier utilize a transparent index-based formula (e.g. ICIS, Platts, FRED PPI Chemicals) and how are natural gas surcharges applied?",
        pillar: "Index Pricing Formula"
    },
    {
        id: "e3",
        question: "What quality assurance protocols (e.g., ISO-9001, chromatography analysis) are in place to prevent batch-to-batch impurity fluctuations?",
        pillar: "Quality Compliance"
    },
    {
        id: "e4",
        question: "Are the supplied products fully compliant with safety regulations (EU REACH, US TSCA) and environmental hazard certifications?",
        pillar: "Regulatory Compliance"
    },
    {
        id: "e5",
        question: "What is the Product Carbon Footprint (PCF) of the chemicals, and does the supplier provide third-party audited lifecycle emissions data?",
        pillar: "Carbon Intensity"
    },
    {
        id: "e6",
        question: "What are the minimum take-or-pay volume thresholds, and what are the procedures for handling supply allocations during market shortages?",
        pillar: "Contract Flexibility"
    },
    {
        id: "e7",
        question: "Can the vendor integrate real-time inventory tank telemetry directly into our ERP (SAP/Ariba) replenishment workflow?",
        pillar: "Systems Integration"
    },
    {
        id: "e8",
        question: "What is the geographical breakdown of the supplier's feedstock sourcing, and are there potential tariff or customs risks?",
        pillar: "Geopolitical Exposure"
    },
    {
        id: "e9",
        question: "Does the supplier offer price hedging options, caps on variable pricing, or long-term fixed-margin contract clauses?",
        pillar: "Hedging & Protection"
    },
    {
        id: "e10",
        question: "What technical support resources (formulators, chemists) are available to qualify the product on our production line or solve curing issues?",
        pillar: "Technical Support"
    }
];

export type Persona = "investor" | "enterprise" | "interactive";

export interface SageQA {
    id: string;
    question: string;
    pillar: string;
    response?: string;
}

export function getFlow(persona: Persona): SageQA[] {
    return persona === "investor" ? J_FLOW.map(q => ({ ...q })) : E_FLOW.map(q => ({ ...q }));
}
