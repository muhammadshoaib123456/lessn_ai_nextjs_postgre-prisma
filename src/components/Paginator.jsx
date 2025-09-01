"use client";
export default function Paginator({ page, total, pageSize=12, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.floor((page - 1) / 10) * 10 + 1;
  const end = Math.min(pages, start + 9);
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button disabled={start===1} onClick={()=>onChange(start-1)} className="px-2 py-1 disabled:opacity-40">Prev</button>
      {nums.map(n=>(
        <button key={n} onClick={()=>onChange(n)}
          className={`px-3 py-1 rounded ${n===page?'bg-purple-600 text-white':'border'}`}>
          {n}
        </button>
      ))}
      <button disabled={end===pages} onClick={()=>onChange(end+1)} className="px-2 py-1 disabled:opacity-40">Next</button>
    </div>
  );
}
