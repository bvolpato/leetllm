const BOOK_URL = "https://storage.googleapis.com/static.brunovolpato.com/books/leetllm-handbook.pdf"

export function GET() {
    return new Response(null, {
        status: 302,
        headers: {
            Location: BOOK_URL,
            "Cache-Control": "public, max-age=300",
        },
    })
}

export const HEAD = GET
