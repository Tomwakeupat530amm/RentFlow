/**
 * Core OpenRouter Vision Client for RentFlow OCR
 * Supports Free Vision Models with Automatic Fallback & Robust JSON Parsing
 */

export interface CallOpenRouterVisionOptions {
    base64Image: string;
    mimeType: string;
    prompt: string;
    model?: string;
}

export interface OpenRouterMessageContent {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
        url: string;
    };
}

/**
 * Trích xuất và phân tích cú pháp JSON an toàn từ phản hồi của LLM
 * Xử lý trường hợp mô hình trả về markdown code blocks hoặc lời dẫn thừa
 */
export function extractJsonFromResponse<T>(rawText: string): T {
    if (!rawText || typeof rawText !== 'string') {
        throw new Error('Không nhận được nội dung phản hồi từ mô hình AI.');
    }

    // 1. Loại bỏ các khối code block markdown nếu có (```json ... ``` hoặc ``` ... ```)
    let cleaned = rawText.trim();
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = cleaned.match(codeBlockRegex);
    if (match && match[1]) {
        cleaned = match[1].trim();
    }

    // 2. Tìm vị trí dấu ngoặc { ... } bao ngoài cùng của JSON Object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(cleaned) as T;
    } catch (parseError) {
        console.error('Lỗi parse JSON từ OpenRouter:', parseError, '\nNội dung thô:', rawText);
        throw new Error('Dữ liệu AI trả về không đúng định dạng JSON hợp lệ.');
    }
}

/**
 * Gửi request phân tích ảnh đến OpenRouter API
 */
async function sendRequestToOpenRouter(
    model: string,
    apiKey: string,
    prompt: string,
    mimeType: string,
    base64Image: string
): Promise<{ ok: boolean; status: number; text?: string; error?: string }> {
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const requestBody = {
        model,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt,
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: dataUrl,
                        },
                    },
                ],
            },
        ],
        temperature: 0.1,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://rentflow.vn',
            'X-Title': 'RentFlow Property Management',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        // Timeout 30s
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return {
            ok: false,
            status: response.status,
            error: `OpenRouter HTTP ${response.status}: ${errorText}`,
        };
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
        return {
            ok: false,
            status: 200,
            error: 'OpenRouter không trả về nội dung trong choices[0].message.content',
        };
    }

    return {
        ok: true,
        status: 200,
        text: content,
    };
}

/**
 * Hàm phân tích ảnh chính với cơ chế tự động Fallback sang model phụ khi gặp rate limit hoặc lỗi
 */
export async function callOpenRouterVision<T>({
    base64Image,
    mimeType,
    prompt,
    model,
}: CallOpenRouterVisionOptions): Promise<T> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error('Chưa cấu hình OPENROUTER_API_KEY trong tệp .env.local.');
    }

    const primaryModel = model || process.env.OPENROUTER_MODEL || 'openrouter/free';
    const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || 'dots-studio/dots-3-note-preview:free';

    console.log(`🤖 [OpenRouter OCR] Bắt đầu gọi model chính: ${primaryModel}`);

    try {
        const result = await sendRequestToOpenRouter(primaryModel, apiKey, prompt, mimeType, base64Image);

        if (result.ok && result.text) {
            return extractJsonFromResponse<T>(result.text);
        }

        console.warn(`⚠️ [OpenRouter OCR] Model chính (${primaryModel}) gặp lỗi (Status: ${result.status}): ${result.error}. Đang thử fallback sang ${fallbackModel}...`);

        // Thử lại với fallback model nếu model chính lỗi hoặc rate limit (429)
        if (primaryModel !== fallbackModel) {
            const fallbackResult = await sendRequestToOpenRouter(fallbackModel, apiKey, prompt, mimeType, base64Image);
            if (fallbackResult.ok && fallbackResult.text) {
                console.log(`✅ [OpenRouter OCR] Fallback sang ${fallbackModel} thành công!`);
                return extractJsonFromResponse<T>(fallbackResult.text);
            }
            throw new Error(fallbackResult.error || 'Cả mô hình chính và mô hình dự phòng đều không phản hồi.');
        }

        throw new Error(result.error || 'Không thể nhận diện hình ảnh.');
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('❌ [OpenRouter OCR] Ngoại lệ khi xử lý:', message);

        if (message.includes('429')) {
            throw new Error('Hệ thống AI miễn phí đang xử lý nhiều yêu cầu. Vui lòng thử lại sau giây lát.');
        }

        throw new Error(`Lỗi nhận diện AI: ${message}`);
    }
}
