import { useState, useEffect } from "react";

const listTags = [
    'dev',
    'product',
    'personal',
    'work',
    'family',
    'hobbies',
    'education',
    'finance',
    'health',
    'politics',
    'science',
    'sports',
    'entertainment',
    'music',
    'travel',
    'custom',
    'bookmarks',
    'notes',
    'todo',
    'shopping',
    'reminders',
    'calendar',
    'settings',
    'help',
    'about',
    'contact',
    'feedback',
    'privacy',
    'terms',
    'cookies',
    'advertising',
    'support',
    'help-center',
    'feedback-form',
    'logout',
    'login',
]

export default function TagChips() {
    const [tags, setTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
       setTags(listTags)
    }, []);

    async function handleSelectedTags(tag: string) {
        const response = await fetch(`/api/gmail/links?tag=${encodeURIComponent(tag)}`);
        const data = await response.json();
        setSelectedTags([...selectedTags, tag]);
    }

    return (
        <div className="flex gap-2">
            {tags.map((tag) => (
                <button
                    key={tag}
                    onClick={() => handleSelectedTags(tag)}
                    className={`border border-gray-300 px-4 py-2 rounded-md text-sm text-gray-700 ${selectedTags.includes(tag)? 'bg-gray-200' : ''}`}
                >
                    {tag}
                </button>
            ))}
        </div>
    );
}