export default function PortalPage() {
    return (
        <div className="space-y-6">
            <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold">Welcome Back!</h2>
                <p className="opacity-90 mt-1">Ready to join an activity today?</p>
            </div>

            <h3 className="text-lg font-semibold">Upcoming Activities</h3>
            {/* Activity Feed Placeholder */}
            <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-20 w-full bg-gray-100 rounded"></div>
                    <div className="flex justify-between items-center mt-3">
                        <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">Join</button>
                    </div>
                </div>
                <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-20 w-full bg-gray-100 rounded"></div>
                    <div className="flex justify-between items-center mt-3">
                        <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">Join</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
