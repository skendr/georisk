import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "GeoRisk-Dashboard/1.0" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }

  const data = await res.json();
  if (!data.length) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  const { lat, lon, display_name } = data[0];
  return NextResponse.json({
    lat: parseFloat(lat),
    lng: parseFloat(lon),
    displayName: display_name,
  });
}
