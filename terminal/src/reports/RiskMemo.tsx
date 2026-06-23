/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Svg, Polygon, Line, Circle, Path } from '@react-pdf/renderer';

// --- STYLES (Bloomberg Aesthetic) ---
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#000',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        paddingBottom: 10,
        marginBottom: 20,
    },
    logoText: {
        fontSize: 18,
        fontFamily: 'Times-Bold', // Serif Font for "ASI RISK INTELLIGENCE"
        textTransform: 'uppercase',
    },
    confidential: {
        fontSize: 10,
        color: '#666',
        alignSelf: 'flex-end',
        fontFamily: 'Helvetica',
    },
    verdictContainer: {
        position: 'absolute',
        top: 40,
        right: 40,
        borderWidth: 2,
        padding: 10,
        alignItems: 'center',
        width: 150,
    },
    verdictLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'Helvetica-Bold',
    },
    verdictValue: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        borderBottomWidth: 1,
        borderBottomColor: '#CCC',
        marginBottom: 10,
        marginTop: 20,
        paddingBottom: 4,
        fontFamily: 'Helvetica-Bold',
    },
    row: {
        flexDirection: 'row',
        gap: 20,
    },
    col50: {
        width: '50%',
    },
    table: {
        width: '100%',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#000',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingVertical: 6,
        alignItems: 'center',
    },
    tableHeader: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
        color: '#444',
    },
    cellText: {
        fontSize: 9,
    },
    codeSnippet: {
        backgroundColor: '#F5F5F5',
        padding: 10,
        fontFamily: 'Courier',
        fontSize: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#FF0000',
        marginTop: 5,
        color: '#DD0000', // Red text for violations
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: '#888',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    }
});

// --- TYPES ---
interface RiskMemoProps {
    modelName: string;
    auditDate: string;
    lineageHash: string;
    scores: {
        overall: number;
        safety: number;
        economics: number;
    };
    metrics: {
        netBurn: number;
        taskSuccessRate: number; // New v3.0 metric
        goalFidelity: number;
        behavioralConsistency: number; // New v3.0 metric
    };
    history: number[];
    violationLog?: string;
}

// --- HELPERS ---
const getVerdict = (score: number) => {
    if (score >= 70) return { label: 'ADB: INVESTMENT GRADE', color: '#00AA00', bg: '#E6FFE6' };
    if (score >= 40) return { label: 'ADB: SPECULATIVE', color: '#DDDD00', bg: '#FFFFE0' };
    return { label: 'ADB: VAPORWARE DETECTED', color: '#DD0000', bg: '#FFE6E6' };
};

const TrafficLight = ({ status }: { status: 'green' | 'yellow' | 'red' }) => {
    const color = status === 'green' ? '#00AA00' : status === 'yellow' ? '#DDDD00' : '#DD0000';
    return <Circle cx="5" cy="5" r="4" fill={color} />;
};

// --- COMPONENTS ---

// Safety Triangle Radar Chart
const SafetyTriangle = ({ behavioralConsistency, goalFidelity }: { behavioralConsistency: number, goalFidelity: number }) => {
    // Center (100, 100), Radius 80
    const points = [
        { x: 100, y: 20 },      // Top (Goal Fidelity)
        { x: 170, y: 140 },     // Right (Behavioral Consistency)
        { x: 30, y: 140 }       // Left (Placeholder for a third safety metric if needed)
    ];

    // Data Points (Scale 0-100)
    // Behavioral Consistency is a divergence index (0-2), convert to 0-100 score
    const consistencyScore = Math.max(0, 100 - (behavioralConsistency * 50));


    const getCoord = (value: number, idx: number) => {
        const ratio = value / 100;
        const tx = points[idx].x;
        const ty = points[idx].y;
        return {
            x: 100 + (tx - 100) * ratio,
            y: 100 + (ty - 100) * ratio
        };
    };

    const p1 = getCoord(goalFidelity, 0);   // Goal Fidelity (Top)
    const p2 = getCoord(consistencyScore, 1);    // Behavioral Consistency (Right)
    const p3 = getCoord(100, 2);   // Placeholder (Left), can be used for another safety metric

    const polyPoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;

    return (
        <Svg height="160" width="200">
            {/* Grid Triangle */}
            <Polygon points="100,20 170,140 30,140" stroke="#DDD" strokeWidth={1} fill="none" />
            {/* Axes */}
            <Line x1="100" y1="100" x2="100" y2="20" stroke="#EEE" />
            <Line x1="100" y1="100" x2="170" y2="140" stroke="#EEE" />
            <Line x1="100" y1="100" x2="30" y2="140" stroke="#EEE" />

            {/* Data Polygon */}
            <Polygon points={polyPoints} fill="rgba(0, 0, 255, 0.1)" stroke="#0000FF" strokeWidth={2} />

            {/* Labels */}
            <Text x="85" y="15" style={{ fontSize: 8, fill: '#666' }}>GOAL FIDELITY</Text>
            <Text x="145" y="145" style={{ fontSize: 8, fill: '#666' }}>BEHAVIORAL CONSISTENCY</Text>
            <Text x="5" y="145" style={{ fontSize: 8, fill: '#666' }}>PLACEHOLDER</Text>
        </Svg>
    );
};

// Line Chart
const EconomicsChart = ({ data }: { data: number[] }) => {
    const max = Math.max(...data, 10);
    const min = Math.min(...data, 0);
    const range = max - min;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 400;
        const y = 150 - ((d - min) / range) * 150;
        return `${x},${y}`;
    }).join(' ');

    return (
        <Svg height="150" width="400">
            <Line x1="0" y1="150" x2="400" y2="150" stroke="#000" strokeWidth={1} />
            <Line x1="0" y1="0" x2="0" y2="150" stroke="#000" strokeWidth={1} />
            <Path d={`M ${points.replace(/ /g, ' L ')}`} stroke="#00AA00" strokeWidth={2} fill="none" />
            <Text x="5" y="10" style={{ fontSize: 8 }}>Net Burn (Last 30)</Text>
        </Svg>
    );
};

export const RiskMemoDocument: React.FC<RiskMemoProps> = ({
    modelName, auditDate, lineageHash, scores, metrics, history, violationLog
}) => {
    const verdict = getVerdict(scores.overall);

    return (
        <Document>
            {/* PAGE 1: THE EXECUTIVE SIGNAL */}
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.logoText}>ASI RISK INTELLIGENCE</Text>
                        <Text style={{ fontSize: 10, marginTop: 5 }}>Target Asset: {modelName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ ...styles.logoText, fontSize: 12 }}>CONFIDENTIAL</Text>
                        <Text style={{ fontSize: 10, marginTop: 5 }}>{auditDate}</Text>
                    </View>
                </View>

                {/* Verdict Badge */}
                <View style={{ ...styles.verdictContainer, borderColor: verdict.color, backgroundColor: verdict.bg }}>
                    <Text style={{ ...styles.verdictLabel, color: verdict.color }}>{verdict.label}</Text>
                    <Text style={{ ...styles.verdictValue, color: verdict.color }}>{scores.overall}/100</Text>
                </View>

                <View style={{ marginTop: 60 }}></View>

                <View style={styles.row}>
                    {/* Left Col: Triangle & Summary */}
                    <View style={styles.col50}>
                        <Text style={styles.sectionTitle}>SAFETY TRIANGLE</Text>
                        <View style={{ alignItems: 'center', marginVertical: 10 }}>
                            <SafetyTriangle
                                goalFidelity={metrics.goalFidelity}
                                behavioralConsistency={metrics.behavioralConsistency}
                            />
                        </View>

                        <Text style={styles.sectionTitle}>EXECUTIVE SUMMARY</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.5 }}>
                            Model demonstrates {scores.economics > 70 ? 'strong' : 'weak'} profitability
                            (Net Burn: ${metrics.netBurn.toFixed(2)}) using ASI V3.0 metrics.
                            Task Success Rate is {metrics.taskSuccessRate}%.
                            Safety compliance is {scores.safety > 80 ? 'EXCELLENT' : 'CONCERNING'} with a
                            Safety Score of {scores.safety}%.
                            {verdict.label.includes('VAPORWARE') ? ' WARNING: High risk of vaporware detected.' : ''}
                        </Text>
                    </View>

                    {/* Right Col: Key Signals Table */}
                    <View style={styles.col50}>
                        <Text style={styles.sectionTitle}>KEY SIGNALS</Text>

                        <View style={styles.table}>
                            {/* Header */}
                            <View style={styles.tableRow}>
                                <Text style={{ ...styles.tableHeader, width: '35%' }}>METRIC</Text>
                                <Text style={{ ...styles.tableHeader, width: '20%' }}>SCORE</Text>
                                <Text style={{ ...styles.tableHeader, width: '25%' }}>BENCHMARK</Text>
                                <Text style={{ ...styles.tableHeader, width: '20%' }}>STATUS</Text>
                            </View>

                            {/* Rows */}
                            <TableRow
                                label="Net Burn"
                                value={`$${metrics.netBurn.toFixed(2)}`}
                                benchmark="-$0.05"
                                status={metrics.netBurn > -0.05 ? 'green' : 'red'}
                            />
                            <TableRow
                                label="Task Success"
                                value={`${metrics.taskSuccessRate}%`}
                                benchmark="85%"
                                status={metrics.taskSuccessRate >= 85 ? 'green' : (metrics.taskSuccessRate > 50 ? 'yellow' : 'red')}
                            />
                            <TableRow
                                label="Goal Fidelity"
                                value={`${metrics.goalFidelity}%`}
                                benchmark="85%"
                                status={metrics.goalFidelity >= 85 ? 'green' : (metrics.goalFidelity > 50 ? 'yellow' : 'red')}
                            />
                            <TableRow
                                label="Behavioral Con."
                                value={`${(Math.max(0, 100 - (metrics.behavioralConsistency * 50))).toFixed(0)}%`}
                                benchmark="0.5 Divergence" // or 75% consistency
                                status={metrics.behavioralConsistency <= 0.5 ? 'green' : (metrics.behavioralConsistency < 1 ? 'yellow' : 'red')}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>Source Hash: {lineageHash.substring(0, 16)}... | Verified on ABC Protocol • Page 1 of 2</Text>
                </View>
            </Page>

            {/* PAGE 2: THE AUDIT TRAIL */}
            <Page size="A4" style={styles.page}>
                <View style={styles.headerRow}>
                    <Text style={styles.logoText}>THE AUDIT TRAIL</Text>
                    <Text style={styles.confidential}>IMMUTABLE RECORD</Text>
                </View>

                <Text style={styles.sectionTitle}>UNIT ECONOMICS (LAST 30 RUNS)</Text>
                <View style={{ marginVertical: 20 }}>
                    <EconomicsChart data={history.length ? history : [0, 0]} />
                </View>

                <Text style={styles.sectionTitle}>VIOLATION LOGS</Text>
                {violationLog ? (
                    <View style={styles.codeSnippet}>
                        <Text>{violationLog}</Text>
                    </View>
                ) : (
                    <Text style={{ fontSize: 10, color: '#00AA00', marginTop: 5 }}>
                        No active violations detected in this audit window.
                    </Text>
                )}

                <View style={{ marginTop: 'auto', marginBottom: 20 }}>
                    <Text style={styles.sectionTitle}>CRYPTOGRAPHIC LINEAGE</Text>
                    <Text style={{ fontSize: 9, fontFamily: 'Courier', color: '#444' }}>
                        Full SHA-256 Hash:
                    </Text>
                    <Text style={{ fontSize: 9, fontFamily: 'Courier', marginVertical: 5 }}>
                        {lineageHash}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#666' }}>
                        This document is strictly confidential. Generated by ASI Signal Platform V3.0.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text>Source Hash: {lineageHash.substring(0, 16)}... | Verified on ABC Protocol • Page 2 of 2</Text>
                </View>

            </Page>
        </Document>
    );
};

const TableRow = ({ label, value, benchmark, status }: any) => (
    <View style={styles.tableRow}>
        <Text style={{ ...styles.cellText, width: '35%' }}>{label}</Text>
        <Text style={{ ...styles.cellText, width: '20%', fontWeight: 'bold' }}>{value}</Text>
        <Text style={{ ...styles.cellText, width: '25%', color: '#666' }}>{benchmark}</Text>
        <View style={{ width: '20%', alignItems: 'center', flexDirection: 'row', gap: 5 }}>
            <TrafficLight status={status} />
            <Text style={{ fontSize: 8 }}>{status.toUpperCase()}</Text>
        </View>
    </View>
);