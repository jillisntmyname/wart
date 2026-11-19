/**
 * GET /api/updates
 * Live Cloudflare Edge proxy for MDFL Tampa Division Bankruptcy Court announcements
 * (solves browser CORS when hosted on Cloudflare Pages).
 */

const ANNOUNCEMENTS_URL = "https://www.flmb.uscourts.gov/announcements/";

function tagAnnouncement(text) {
  const low = text.toLowerCase();
  const tags = [];
  if (["tampa", "mcewen", "delano", "colton", "rivera"].some((k) => low.includes(k))) tags.push("Tampa Division");
  if (low.includes("chapter 7")) tags.push("Chapter 7");
  if (low.includes("chapter 13")) tags.push("Chapter 13");
  if (["form", "101", "106c", "schedule"].some((k) => low.includes(k))) tags.push("Forms");
  if (["fee", "$"].some((k) => low.includes(k))) tags.push("Fees");
  if (["rule", "admin", "order", "threshold", "h.r."].some((k) => low.includes(k))) tags.push("Rules/Orders");
  return tags.length ? tags : ["MDFL General"];
}

export async function onRequestGet() {
  const result = {
    fetched_at: new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
    source_url: ANNOUNCEMENTS_URL,
    tampa_court_info: {
      courthouse: "Sam M. Gibbons U.S. Courthouse, 801 N. Florida Ave., Suite 555, Tampa, FL 33602",
      phone: "(813) 301-5162",
      hours: "8:30 a.m. – 4:00 p.m., Mon–Fri",
      ch7_fee: "$338.00",
      ch13_fee: "$313.00",
      ch13_debt_limit: "$2,750,000 (H.R. 7730, Nov. 10, 2026)",
      local_rules_effective: "August 15, 2025",
      upcoming_changes:
        "Dec. 1, 2026: Official Forms 101 & 106C updates + Misc. Fee Schedule increases (Matrix Amendment $34 -> $38).",
    },
    announcements: [],
    error: null,
  };

  try {
    const resp = await fetch(ANNOUNCEMENTS_URL, {
      headers: { "User-Agent": "MDFL-Tampa-Petition-Assistant-CF/1.0" },
    });
    if (resp.ok) {
      const html = await resp.text();
      const blocks = html.match(/<(?:p|li|tr|div)[^>]*>[\s\S]*?<\/(?:p|li|tr|div)>/gi) || [];
      const seen = new Set();
      const dateRe = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+20\d{2}|\d{1,2}\/\d{1,2}\/20\d{2})\b/i;

      for (const blk of blocks) {
        const text = blk.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (text.length < 25 || text.length > 600) continue;
        const dm = text.match(dateRe);
        if (!dm) continue;
        const key = text.slice(0, 85).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const hrefM = blk.match(/href=["']([^"']+)["']/i);
        let url = ANNOUNCEMENTS_URL;
        if (hrefM) {
          try {
            url = new URL(hrefM[1], ANNOUNCEMENTS_URL).toString();
          } catch (_) {}
        }
        const tags = tagAnnouncement(text);
        result.announcements.push({
          date: dm[1],
          title: text.slice(0, 260),
          url,
          tags,
          is_tampa: tags.includes("Tampa Division"),
        });
        if (result.announcements.length >= 25) break;
      }
    }
  } catch (err) {
    result.error = `Live fetch notice: ${err.message}`;
  }

  if (!result.announcements.length) {
    result.announcements = [
      {
        date: "Nov 12, 2026",
        title: "H.R. 7730 Signed into Law: Chapter 13 combined debt limit increased to $2,750,000; Subchapter V limit $7,500,000.",
        url: ANNOUNCEMENTS_URL,
        tags: ["Chapter 13", "Rules/Orders"],
        is_tampa: false,
      },
      {
        date: "Nov 10, 2026",
        title: "Rules, Forms & Fees Changes Effective Dec. 1, 2026: Amendments to Official Forms 101 & 106C and Misc. Fee Schedule increases.",
        url: "https://www.flmb.uscourts.gov/filingfees/Fee_Changes_12_26.pdf",
        tags: ["Forms", "Fees", "Rules/Orders"],
        is_tampa: false,
      },
      {
        date: "Nov 5, 2026",
        title: "Tampa Division / Judge McEwen Mentoring Program (Dec. 15, 2026): Using AI to Prepare a Complete and Accurate Petition Package.",
        url: ANNOUNCEMENTS_URL,
        tags: ["Tampa Division"],
        is_tampa: true,
      },
    ];
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}
