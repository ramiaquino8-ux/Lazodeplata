"use client";

import { useState } from "react";
import { AVATARES } from "@/lib/validaciones";

export function AvatarPicker({
  nombre = "avatar",
  inicial = AVATARES[0],
}: {
  nombre?: string;
  inicial?: (typeof AVATARES)[number];
}) {
  const [elegido, setElegido] = useState<typeof AVATARES[number]>(inicial);

  return (
    <div role="radiogroup" aria-label="Elegí un avatar" className="flex flex-wrap gap-2">
      {AVATARES.map((a) => (
        <label
          key={a}
          className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-2xl transition focus-within:ring-2 focus-within:ring-indigo-400 ${
            elegido === a
              ? "bg-indigo-100 ring-2 ring-indigo-500"
              : "bg-slate-100 hover:bg-slate-200"
          }`}
        >
          <input
            type="radio"
            name={nombre}
            value={a}
            checked={elegido === a}
            onChange={() => setElegido(a)}
            className="sr-only"
          />
          <span aria-hidden="true">{a}</span>
        </label>
      ))}
    </div>
  );
}