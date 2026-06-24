import { NextResponse } from "next/server";
import { publicGame } from "@/lib/game";
import { action, getGame, joinGame } from "@/lib/store";

type Params = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Params) {
  const { code } = await params;
  const game = getGame(code);
  if (!game) return NextResponse.json({ error: "Potje niet gevonden." }, { status: 404 });
  const token = new URL(request.url).searchParams.get("token") ?? undefined;
  return NextResponse.json(publicGame(game, token));
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const game = getGame(code);
    if (!game) throw new Error("Potje niet gevonden.");
    const body = await request.json();
    if (body.type === "join") {
      const joined = joinGame(game, body.name?.trim(), body.avatar);
      return NextResponse.json({ token: joined.token, game: publicGame(game, joined.token) });
    }
    action(game, body.token, body.type, body.payload);
    return NextResponse.json(publicGame(game, body.token));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Actie mislukt." }, { status: 400 });
  }
}
