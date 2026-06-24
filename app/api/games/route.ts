import { NextResponse } from "next/server";
import { createGame } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name?.trim() || !body.task?.trim()) throw new Error("Naam en opdracht zijn verplicht.");
    const { game, token } = createGame(body);
    return NextResponse.json({ code: game.code, token }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Aanmaken mislukt." }, { status: 400 });
  }
}
