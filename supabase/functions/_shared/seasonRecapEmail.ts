export interface SeasonRecapImageUrls {
  hero?: string;
  communityAccuracy?: string;
  calebRecord?: string;
  playoff?: string;
  romeOdunze?: string;
  offenseSurprise?: string;
  draft?: string;
}

export interface SeasonRecapLinks {
  dashboard: string;
  recap: string;
}

interface SeasonRecapTemplateOptions {
  previewText: string;
  imageUrls: SeasonRecapImageUrls;
  links: SeasonRecapLinks;
  unsubscribeUrl?: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderImageSection({
  imageUrl,
  alt,
  href,
  topPadding = 20,
}: {
  imageUrl?: string;
  alt: string;
  href?: string;
  topPadding?: number;
}) {
  if (!imageUrl) return "";

  const img = `
    <img
      src="${escapeHtml(imageUrl)}"
      alt="${escapeHtml(alt)}"
      width="616"
      style="display:block; width:100%; max-width:616px; height:auto; border:1px solid #cbd5e1; border-radius:24px;"
    />
  `;

  return `
    <tr>
      <td style="padding:${topPadding}px 32px 0 32px;">
        ${
          href
            ? `<a href="${escapeHtml(href)}" style="display:block; text-decoration:none;">${img}</a>`
            : img
        }
      </td>
    </tr>
  `;
}

export function buildSeasonRecapEmail({
  previewText,
  imageUrls,
  links,
  unsubscribeUrl,
}: SeasonRecapTemplateOptions) {
  const safePreviewText = escapeHtml(previewText);
  const safeDashboardUrl = escapeHtml(links.dashboard);
  const safeRecapUrl = escapeHtml(links.recap);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>2025 Season Recap</title>
  </head>
  <body style="margin:0; padding:0; background-color:#eef2ff; font-family:Arial, Helvetica, sans-serif; color:#1e293b;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${safePreviewText}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#eef2ff; margin:0; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; max-width:680px; background-color:#ffffff; border-radius:24px; overflow:hidden;">
            <tr>
              <td style="background-color:#0b162a; padding:18px 32px; text-align:center;">
                <div style="font-size:20px; line-height:28px; font-weight:800; color:#ffffff;">Bears Prediction Tracker</div>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <div style="font-size:12px; line-height:18px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:#c83803;">
                  2025 Season Recap
                </div>
                <h1 style="margin:14px 0 0 0; font-size:40px; line-height:44px; font-weight:900; color:#0b162a;">
                  How Bears Fans Predicted the Season
                </h1>
                <div style="margin-top:14px; font-size:14px; line-height:20px; color:#64748b;">
                  By Irfan | Published March 22, 2026
                </div>
              </td>
            </tr>

            ${renderImageSection({
              imageUrl: imageUrls.hero,
              alt: "Caleb Williams smiling with Ben Johnson on the sideline",
              href: safeRecapUrl,
            })}

            <tr>
              <td style="padding:28px 32px 0 32px; font-size:18px; line-height:32px; color:#334155;">
                <p style="margin:0 0 18px 0;">Hi Bears fan,</p>
                <p style="margin:0 0 18px 0;">
                  Before the season started, Bears Prediction Tracker asked fans to make calls on
                  everything from Caleb's stats to the draft to whether this team would end the
                  playoff drought. Hundreds of you locked in your picks.
                </p>
                <p style="margin:0;">The dust has settled. Here's how Bears fans did.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:36px 32px 0 32px;">
                <div style="font-size:12px; line-height:18px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:#64748b;">
                  How The Community Did
                </div>
                <h2 style="margin:10px 0 0 0; font-size:28px; line-height:34px; font-weight:900; color:#0b162a;">
                  How accurate were Bears fans across all 13 predictions?
                </h2>
                <div style="margin-top:14px; font-size:17px; line-height:30px; color:#334155;">
                  Across all 13 season questions, Bears fans were most confident, and most correct,
                  on Caleb Williams breaking the franchise's single-season passing record. Other
                  calls were far more divided.
                </div>
              </td>
            </tr>

            ${renderImageSection({
              imageUrl: imageUrls.communityAccuracy,
              alt: "Community accuracy chart for 2025 Bears predictions",
              href: safeRecapUrl,
            })}

            <tr>
              <td align="center" style="padding:24px 32px 0 32px;">
                <a
                  href="${safeDashboardUrl}"
                  style="display:inline-block; border-radius:999px; background-color:#c83803; padding:14px 28px; font-size:16px; line-height:20px; font-weight:700; color:#ffffff; text-decoration:none;"
                >
                  Check your results
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 32px 0 32px;">
                <h2 style="margin:0; font-size:32px; line-height:38px; font-weight:900; color:#0b162a;">The Season in Context</h2>
                <div style="margin-top:18px; font-size:17px; line-height:30px; color:#334155;">
                  <p style="margin:0 0 18px 0;">
                    There was cautious optimism heading into 2025. New head coach. Second-year
                    quarterback with sky-high potential. Most fans weren't sure if this was a
                    playoff team or another rebuilding year.
                  </p>
                  <p style="margin:0 0 18px 0;">
                    The Bears exceeded expectations. The offense clicked in the second half. The
                    playoff drought ended. Chicago picked up its first playoff win in over a
                    decade. Caleb delivered clutch performances down the stretch. Iceman.
                  </p>
                  <p style="margin:0;">Now to the predictions.</p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 32px 0 32px;">
                <h2 style="margin:0; font-size:32px; line-height:38px; font-weight:900; color:#0b162a;">The Sure Things</h2>
                <div style="margin-top:18px; font-size:17px; line-height:30px; color:#334155;">
                  <p style="margin:0 0 18px 0;">Some predictions showed overwhelming consensus and fans nailed them.</p>
                  <p style="margin:0 0 18px 0;">
                    Caleb Williams breaking the Bears' single-season passing record was the most
                    confident correct call of the year. Williams threw for 3,942 yards, surpassing
                    Erik Kramer's franchise mark.
                    <span style="font-weight:700; color:#0b162a;"> 90% of fans predicted it, most with high confidence.</span>
                  </p>
                </div>
              </td>
            </tr>

            ${renderImageSection({
              imageUrl: imageUrls.calebRecord,
              alt: "Caleb versus the Bears passing record graphic",
            })}

            <tr>
              <td style="padding:20px 32px 0 32px; font-size:17px; line-height:30px; color:#334155;">
                <p style="margin:0 0 18px 0;">
                  He still fell short of 4,000 yards. No Bears quarterback has ever hit that mark.
                  That will be a prediction in 2026.
                </p>
                <p style="margin:0 0 18px 0;">
                  He also started every game, something 58% of fans correctly predicted, though
                  confidence was mixed. Durability for a Bears QB has been a question mark in the
                  past.
                </p>
                <p style="margin:0 0 18px 0;">
                  One question we probably should have asked was completion percentage. Ben's stated
                  goal for him was 70%, but Williams finished at a league-low 59%.
                </p>
                <p style="margin:0 0 18px 0;">
                  Speaking of BJ, Bears fans had a lot of confidence in him. 79% saw Johnson as a
                  Coach of the Year finalist.
                </p>
                <p style="margin:0 0 18px 0;">
                  While fans trusted Johnson to elevate the offense, they weren't buying the
                  defense. 87% correctly predicted the Bears would not finish as a top-10 defense,
                  most with high confidence. It would have been a bottom-10 unit if not for leading
                  the league in turnovers.
                </p>
                <p style="margin:0;">
                  When it came to win total, 72% predicted the Bears would win more than eight
                  games. Few would have predicted 11 wins, though, given that most weren't even
                  confident the Bears would make the playoffs.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 32px 0 32px;">
                <h2 style="margin:0; font-size:32px; line-height:38px; font-weight:900; color:#0b162a;">The Coin Flip</h2>
                <div style="margin-top:18px; font-size:17px; line-height:30px; color:#334155;">
                  <p style="margin:0 0 18px 0;">
                    The Bears making the playoffs was the most divisive prediction of the season.
                    Just 54% of fans got it right, with confidence spread almost evenly across the
                    board.
                  </p>
                  <p style="margin:0;">A true coin flip and the kind of question we'll have a lot more of in 2026.</p>
                </div>
              </td>
            </tr>

            ${renderImageSection({
              imageUrl: imageUrls.playoff,
              alt: "Playoff prediction split chart",
            })}

            <tr>
              <td style="padding:40px 32px 0 32px;">
                <h2 style="margin:0; font-size:32px; line-height:38px; font-weight:900; color:#0b162a;">The Confident Misses</h2>
                <div style="margin-top:18px; font-size:17px; line-height:30px; color:#334155;">
                  <p style="margin:0 0 18px 0;">Not every strong conviction landed.</p>
                  <p style="margin:0 0 18px 0;">
                    78% of fans predicted Rome Odunze would surpass 1,000 receiving yards. 52%
                    made that call with high confidence. A late-season injury cost him 5 games, and
                    he ultimately fell short of the milestone.
                  </p>
                </div>
              </td>
            </tr>

            ${renderImageSection({
              imageUrl: imageUrls.romeOdunze,
              alt: "Rome Odunze 2025 stat card",
            })}

            <tr>
              <td style="padding:20px 32px 0 32px; font-size:17px; line-height:30px; color:#334155;">
                <p style="margin:0 0 18px 0;">
                  Montez Sweat reaching 10 sacks was another misread, but in the other direction.
                  73% of fans predicted he'd fall short. Sweat just barely got there, a solid
                  rebound from a disappointing 2024.
                </p>
                <p style="margin:0;">
                  The Bears' offense exceeded expectations too, finishing 4th in the NFL in total
                  offense at 375.7 yards per game.
                  <span style="font-weight:700; color:#0b162a;"> Only 40% of fans expected the unit to crack the top ten, which made it one of the biggest surprises of the season.</span>
                </p>
              </td>
            </tr>

            ${renderImageSection({
              imageUrl: imageUrls.offenseSurprise,
              alt: "Offense surprise stat card",
            })}

            <tr>
              <td align="center" style="padding:24px 32px 0 32px;">
                <a
                  href="${safeRecapUrl}"
                  style="display:inline-block; border-radius:999px; background-color:#0b162a; padding:14px 28px; font-size:16px; line-height:20px; font-weight:700; color:#ffffff; text-decoration:none;"
                >
                  Read the full recap
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 32px 0 32px;">
                <h2 style="margin:0; font-size:32px; line-height:38px; font-weight:900; color:#0b162a;">The Impossible Question</h2>
                <div style="margin-top:18px; font-size:17px; line-height:30px; color:#334155;">
                  The hardest question of the year: who would the Bears select with the 10th pick?
                  Most fans expected Penn State tight end Tyler Warren. The Bears went with Colston
                  Loveland, who wasn't even listed as an option.
                </div>
              </td>
            </tr>

            ${renderImageSection({
              imageUrl: imageUrls.draft,
              alt: "Draft prediction graphic",
            })}

            <tr>
              <td style="padding:40px 32px 0 32px;">
                <h2 style="margin:0; font-size:32px; line-height:38px; font-weight:900; color:#0b162a;">What's Next</h2>
                <div style="margin-top:18px; font-size:17px; line-height:30px; color:#334155;">
                  <p style="margin:0 0 18px 0;">All 13 predictions are now resolved and up on the site.</p>
                  <p style="margin:0;">
                    We're already working on 2026. More questions, more categories, and
                    game-by-game picks for the full season. The first 2026 prediction drops in a
                    couple of weeks, starting with the draft.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:28px 32px 0 32px;">
                <a
                  href="${safeDashboardUrl}"
                  style="display:inline-block; border-radius:999px; background-color:#c83803; padding:14px 28px; font-size:16px; line-height:20px; font-weight:700; color:#ffffff; text-decoration:none;"
                >
                  Check your results
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 32px 16px 32px; font-size:18px; line-height:32px; color:#334155;">
                <p style="margin:0 0 18px 0; font-weight:700; color:#0b162a;">Thanks for joining the community.</p>
                <p style="margin:0; font-size:34px; line-height:38px; color:#0b162a; font-family:'Brush Script MT', 'Snell Roundhand', cursive;">
                  Irfan
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 32px 32px 32px; text-align:center; border-top:1px solid #e2e8f0;">
                <div style="font-size:14px; line-height:24px;">
                  <a href="${safeRecapUrl}" style="color:#64748b; text-decoration:underline;">
                    View the recap on the site
                  </a>
                  ${
                    unsubscribeUrl
                      ? `<span style="color:#94a3b8;">&nbsp;|&nbsp;</span>
                  <a href="${escapeHtml(unsubscribeUrl)}" style="color:#64748b; text-decoration:underline;">
                    Unsubscribe
                  </a>`
                      : ""
                  }
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
