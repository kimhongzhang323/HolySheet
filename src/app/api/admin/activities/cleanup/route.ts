import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        console.log("Starting systemic activities cleanup & form population...");

        // 1. Fetch all activities
        const { data: allActivities, error: fetchError } = await supabase
            .from('activities')
            .select('*');

        if (fetchError) throw fetchError;
        if (!allActivities) return NextResponse.json({ message: "No activities found" });

        const toDelete: string[] = [];
        const toUpdate: { id: string, image_url?: string, volunteer_form?: any }[] = [];
        const seen = new Set<string>();

        // Unsplash base IDs for categories as fallbacks/seeds
        const unsplashKeywords: Record<string, string> = {
            'befriending': 'heart',
            'hub': 'community',
            'skills': 'talent',
            'outings': 'nature',
            'volunteer': 'help'
        };

        const defaultForm = {
            title: "Volunteer Application",
            description: "Please provide a few details to help us prepare for your visit.",
            fields: [
                { label: "Emergency Contact Name", type: "text", required: true },
                { label: "Emergency Contact Number", type: "tel", required: true },
                { label: "Dietary Restrictions", type: "select", required: false, options: ["None", "Vegetarian", "Vegan", "Halal", "Gluten-Free"] },
                { label: "Commitment Preference", type: "select", required: true, options: ["Just this session", "Once a month", "Weekly", "Long-term"] },
                { label: "Why do you want to join this mission?", type: "textarea", required: true }
            ]
        };

        for (const act of allActivities) {
            // A. Identity duplicates or "test" events
            const title = act.title || '';
            const isTest = title.toLowerCase().includes('test');
            const identity = `${title}-${act.start_time}-${act.end_time}`;

            if (isTest || seen.has(identity)) {
                toDelete.push(act.id);
                continue;
            }
            seen.add(identity);

            // B. Check for images or missing forms
            const currentImg = act.image_url || '';
            const hasForm = !!act.volunteer_form;

            const needsTitleFix = title.match(/\(Week\s-\d+\)/);

            if (needsTitleFix || !currentImg || currentImg.includes('unsplash.com/photo-') || currentImg.includes('picsum.photos') || !hasForm) {
                const category = (act.category || 'volunteer').toLowerCase();
                const keyword = unsplashKeywords[category] || unsplashKeywords['volunteer'];

                const updates: any = {};

                // Clean Title (Remove Week Suffix) e.g. " (Week -4)"
                if (title.match(/\(Week\s-\d+\)/)) {
                    updates.title = title.replace(/\s\(Week\s-\d+\)/, '');
                }
                // Force unique images using picsum with seed
                if (!currentImg || currentImg.includes('unsplash.com/photo-') || currentImg.includes('picsum.photos')) {
                    // Using the activity ID as seed ensures uniqueness across all events
                    updates.image_url = `https://picsum.photos/seed/${act.id}/800/600`;
                }
                if (!hasForm) {
                    updates.volunteer_form = { ...defaultForm, title: `Application: ${updates.title || title}` };
                } else {
                    // Inject new question into existing form if missing
                    const existingForm = act.volunteer_form;
                    const hasCommitment = existingForm.fields.some((f: any) => f.label === "Commitment Preference");

                    if (!hasCommitment) {
                        const newFields = [...existingForm.fields];
                        // Insert before the last item (usually big text area)
                        const insertIndex = Math.max(0, newFields.length - 1);
                        newFields.splice(insertIndex, 0, {
                            label: "Commitment Preference",
                            type: "select",
                            required: true,
                            options: ["Just this session", "Once a month", "Weekly", "Long-term"]
                        });

                        updates.volunteer_form = { ...existingForm, fields: newFields };
                    }
                }

                // Preserve high-fidelity data if it exists or use defaults
                if (!act.activity_type) updates.activity_type = (act.category === 'befriending' ? 'Befriending' : 'Hub Support');
                if (!act.organizer) updates.organizer = 'MINDS Community Office';
                if (!act.schedule) updates.schedule = 'Flexible Schedule';
                if (!act.requirements || act.requirements.length === 0) {
                    updates.requirements = ["Committed to the cause", "Friendly and approachable", "Fully vaccinated"];
                }

                toUpdate.push({
                    id: act.id,
                    ...updates
                });
            }
        }

        console.log(`Cleanup plan: Delete ${toDelete.length}, Update ${toUpdate.length}`);

        // 2. Perform Deletions
        if (toDelete.length > 0) {
            const { error: delError } = await supabase
                .from('activities')
                .delete()
                .in('id', toDelete);

            if (delError) console.error("Deletion error:", delError);
        }

        // 3. Perform Updates
        for (const up of toUpdate) {
            const { id, ...payload } = up;
            await supabase.from('activities').update(payload).eq('id', id);
        }

        return NextResponse.json({
            success: true,
            deleted: toDelete.length,
            updated: toUpdate.length,
            message: "System successfully cleaned and enhanced with application forms."
        });

    } catch (error: any) {
        console.error('Cleanup API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
