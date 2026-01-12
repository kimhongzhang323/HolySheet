export default function AdminPage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Master Calendar Placeholder */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Master Schedule</h3>
                    <button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded">
                        + New Activity
                    </button>
                </div>
                <div className="h-96 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                    Calendar View
                </div>
            </div>

            {/* Crisis Dashboard / Stats */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Urgent: Volunteers Needed</h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-red-50 border border-red-100 rounded text-sm flex justify-between">
                            <span>Art Therapy (Sat)</span>
                            <span className="font-bold text-red-700">3 needed</span>
                        </div>
                        <button className="w-full mt-2 bg-gray-900 text-white text-xs py-2 rounded">
                            Blast WhatsApp Notification
                        </button>
                    </div>
                </div>

                {/* Ops Copilot */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-2">Ops Copilot</h3>
                    <textarea
                        className="w-full p-2 text-sm border rounded-lg h-24 resize-none mb-2"
                        placeholder="Ask AI: Summarize feedback from yesterday..."
                    />
                    <button className="w-full bg-indigo-600 text-white text-sm py-2 rounded">
                        Analyze
                    </button>
                </div>
            </div>
        </div>
    );
}
