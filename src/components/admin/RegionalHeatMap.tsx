'use client';

import { MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface RegionData {
    id: string;
    name: string;
    volunteers: number;
    areas: string[];
}

// 5 Singapore CDC Regions with volunteer data
const REGIONS: RegionData[] = [
    {
        id: 'central',
        name: 'Central Singapore',
        volunteers: 245,
        areas: ['Bishan', 'Bukit Merah', 'Bukit Timah', 'Downtown', 'Geylang', 'Kallang', 'Marina', 'Novena', 'Queenstown', 'Toa Payoh']
    },
    {
        id: 'northeast',
        name: 'North-East',
        volunteers: 178,
        areas: ['Ang Mo Kio', 'Hougang', 'Punggol', 'Sengkang', 'Serangoon']
    },
    {
        id: 'northwest',
        name: 'North-West',
        volunteers: 156,
        areas: ['Bukit Batok', 'Bukit Panjang', 'Choa Chu Kang', 'Clementi', 'Jurong East', 'Jurong West', 'Woodlands']
    },
    {
        id: 'southeast',
        name: 'South-East',
        volunteers: 134,
        areas: ['Bedok', 'Changi', 'Marine Parade', 'Pasir Ris', 'Tampines']
    },
    {
        id: 'southwest',
        name: 'South-West',
        volunteers: 98,
        areas: ['Boon Lay', 'Pioneer', 'Tuas', 'Tengah']
    },
];

function getRegionColor(count: number): { bg: string; text: string; bar: string } {
    if (count >= 200) return { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' };
    if (count >= 150) return { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-400' };
    if (count >= 100) return { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-400' };
    return { bg: 'bg-red-50', text: 'text-red-600', bar: 'bg-red-400' };
}

export default function RegionalHeatMap() {
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const maxVolunteers = Math.max(...REGIONS.map(r => r.volunteers));
    const totalVolunteers = REGIONS.reduce((sum, r) => sum + r.volunteers, 0);

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <MapPin className="text-gray-400" size={20} />
                    Volunteer Distribution by Region
                </h3>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-900">{totalVolunteers}</span>
                    <span className="text-xs text-gray-500">total volunteers</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map Image */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-sky-50 to-blue-100">
                    <Image
                        src="/images/singapore-map.png"
                        alt="Singapore Map"
                        width={600}
                        height={400}
                        className="w-full h-auto"
                        priority
                    />

                    {/* Legend Overlay */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                <span className="text-gray-600">High</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                                <span className="text-gray-600">Medium</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                <span className="text-gray-600">Low</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Region List */}
                <div className="space-y-3">
                    {REGIONS.map((region) => {
                        const colors = getRegionColor(region.volunteers);
                        const percentage = (region.volunteers / maxVolunteers) * 100;
                        const isSelected = selectedRegion === region.id;

                        return (
                            <div
                                key={region.id}
                                className={`p-4 rounded-xl cursor-pointer transition-all ${isSelected
                                        ? `${colors.bg} ring-2 ring-offset-1 ring-gray-300`
                                        : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                onClick={() => setSelectedRegion(isSelected ? null : region.id)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${colors.bar}`}></div>
                                        <span className="font-bold text-gray-900">{region.name}</span>
                                    </div>
                                    <span className={`font-bold text-lg ${colors.text}`}>
                                        {region.volunteers}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                {/* Areas - show when selected */}
                                {isSelected && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-2">Planning Areas:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {region.areas.map((area) => (
                                                <span
                                                    key={area}
                                                    className="px-2 py-0.5 bg-white rounded text-xs text-gray-600"
                                                >
                                                    {area}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-5 gap-3">
                {REGIONS.map((region) => {
                    const colors = getRegionColor(region.volunteers);
                    return (
                        <div
                            key={region.id}
                            className={`rounded-xl p-3 text-center cursor-pointer transition-all hover:scale-105 ${selectedRegion === region.id ? colors.bg : 'bg-gray-50'
                                }`}
                            onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
                        >
                            <div className={`w-4 h-4 rounded-full ${colors.bar} mx-auto mb-2`}></div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate">
                                {region.name.replace('Singapore', '').trim()}
                            </p>
                            <p className={`text-lg font-bold ${colors.text}`}>{region.volunteers}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
