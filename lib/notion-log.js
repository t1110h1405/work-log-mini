import { Client } from "@notionhq/client";

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function hasRealValue(value = "") {
  return Boolean(value) && !value.includes("xxxxxxxx");
}

export function isNotionConfigured() {
  return hasRealValue(process.env.NOTION_TOKEN) && hasRealValue(process.env.NOTION_DATABASE_ID);
}

export function deviceLabel(userAgent = "") {
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "iPhone";
  }
  if (/android/i.test(userAgent)) {
    return "Android";
  }
  if (/macintosh|mac os x/i.test(userAgent)) {
    return "Mac";
  }
  if (/windows/i.test(userAgent)) {
    return "Windows";
  }
  return "Web";
}

export function validatePayload(body) {
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const durationMin = Number(body.durationMin);
  const startAt = body.startAt ? parseDate(body.startAt) : null;
  const endAt = body.endAt ? parseDate(body.endAt) : null;
  const date = body.date ? parseDate(body.date) : new Date();

  if (!content) {
    return { error: "内容を入力してください。" };
  }

  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return { error: "作業時間は1分以上で保存してください。" };
  }

  if (!date) {
    return { error: "日付の形式が正しくありません。" };
  }

  if (body.startAt && !startAt) {
    return { error: "開始時刻の形式が正しくありません。" };
  }

  if (body.endAt && !endAt) {
    return { error: "終了時刻の形式が正しくありません。" };
  }

  return {
    content,
    durationMin: Math.round(durationMin),
    startAt,
    endAt,
    date
  };
}

export async function createNotionLog(body, userAgent = "") {
  if (!isNotionConfigured()) {
    return {
      status: 500,
      payload: {
        ok: false,
        error: "Notionの接続設定が不足しています。.env を確認してください。"
      }
    };
  }

  const validated = validatePayload(body);
  if ("error" in validated) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: validated.error
      }
    };
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const pagePayload = {
    parent: {
      database_id: process.env.NOTION_DATABASE_ID
    },
    properties: {
      Title: {
        title: [
          {
            text: {
              content: validated.content
            }
          }
        ]
      },
      Date: {
        date: {
          start: validated.date.toISOString()
        }
      },
      DurationMin: {
        number: validated.durationMin
      },
      Device: {
        rich_text: [
          {
            text: {
              content: deviceLabel(userAgent)
            }
          }
        ]
      }
    }
  };

  if (validated.startAt) {
    pagePayload.properties.StartAt = {
      date: {
        start: validated.startAt.toISOString()
      }
    };
  }

  if (validated.endAt) {
    pagePayload.properties.EndAt = {
      date: {
        start: validated.endAt.toISOString()
      }
    };
  }

  try {
    const page = await notion.pages.create(pagePayload);
    return {
      status: 201,
      payload: {
        ok: true,
        id: page.id
      }
    };
  } catch (error) {
    return {
      status: 500,
      payload: {
        ok: false,
        error:
          error?.body?.message ||
          error?.message ||
          "Notionへの保存でエラーが発生しました。"
      }
    };
  }
}
