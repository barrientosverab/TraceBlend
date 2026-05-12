import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RadarCatacionProps {
    data: {
        fragrance_aroma: number;
        flavor: number;
        aftertaste: number;
        acidity: number;
        body: number;
        balance: number;
        overall: number;
    };
    title?: string;
    color?: string;
}

export function RadarCatacion({ data, title = 'Perfil Sensorial', color = '#10b981' }: RadarCatacionProps) {
    const chartData = [
        { attribute: 'Fragancia/Aroma', value: data.fragrance_aroma, fullMark: 10 },
        { attribute: 'Sabor', value: data.flavor, fullMark: 10 },
        { attribute: 'Residual', value: data.aftertaste, fullMark: 10 },
        { attribute: 'Acidez', value: data.acidity, fullMark: 10 },
        { attribute: 'Cuerpo', value: data.body, fullMark: 10 },
        { attribute: 'Balance', value: data.balance, fullMark: 10 },
        { attribute: 'General', value: data.overall, fullMark: 10 },
    ];

    return (
        <div className="bg-white p-6 rounded-2xl border border-stone-200">
            <h4 className="font-bold text-stone-800 mb-4 text-center">{title}</h4>
            <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={chartData}>
                    <PolarGrid stroke="#e7e5e4" />
                    <PolarAngleAxis
                        dataKey="attribute"
                        tick={{ fill: '#57534e', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[6, 10]}
                        tick={{ fill: '#78716c', fontSize: 10 }}
                    />
                    <Radar
                        name="Puntuación"
                        dataKey="value"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.3}
                        strokeWidth={2}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #e7e5e4',
                            borderRadius: '12px',
                            padding: '8px 12px'
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={((value: unknown) => `${Number(value).toFixed(2)}`) as any}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
