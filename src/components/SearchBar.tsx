import React, { useState } from 'react';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<any[]>([]);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const response = await fetch(`/api/gmail/links?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setItems(data.items);
    }
    return (
        <div className="flex-1">
            <form onSubmit={handleSearch} className="flex">
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher..." className="border px-3 py-2 rounded-l w-full" />
                <button className="bg-blue-500 text-white px-4 rounded-r">OK</button>
            </form>
            {items.length>0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {items.map((bm:any)=>(
                        <div key={bm.id} className="border rounded p-2">
                            <a href={bm.url} target="_blank">{bm.title || bm.url}</a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}