export async function copyText(text: string) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return
    }

    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
}

export async function copyMarkdownFromUrl(url: string) {
    const response = await fetch(url, {
        headers: {
            Accept: "text/markdown",
        },
    })
    if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status}`)
    }
    const markdown = await response.text()
    await copyText(markdown)
    return markdown
}
