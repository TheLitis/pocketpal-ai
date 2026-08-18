# Getting Started

Note: Part of this guide is outdated. It will be updated soon.

## Installation

**iPhone** users can grab it here: [PocketPal AI on the App Store](https://apps.apple.com/us/app/pocketpal-ai/id6502579498)

**Android** users can get it from here: [PocketPal AI on Google Play](https://play.google.com/store/apps/details?id=com.pocketpalai)

Note: This is a personal project, so I am working on it in my spare time. It might have bugs and issues, and obviously, I have not tested it on all devices. If you encounter any issues, open an issue, or even better, contribute to the project!


### Available Models
PocketPal AI comes pre-configured with some popular SLMs:

- Danube 2 and 3
- Phi
- Gemma 2
- Qwen

Modells need to be downloaded before use. You can download and use these models directly from the app and load any other GGUF models you like!

<div style="display: flex; justify-content: center;">
    <img src="../assets/models_page.webp" alt="Models Page" style="width: 33%;">
</div>

## Using PocketPal AI

### Downloading a Model

- Tap the burger menu
- Navigate to the “Models” page
- Choose your desired model and hit download


<div style="display: flex; justify-content: center;">
    <img src="../assets/add_model_1.webp" alt="Navigate to Models Page" style="width: 33%;">
    <img src="../assets/add_model_2.webp" alt="Download a Model" style="width: 33%;">
    <img src="../assets/add_model_3.webp" alt="Load a Model" style="width: 33%;">
</div>

### Loading a Model
After downloading, tap *Load* to bring the model into memory. Now you’re ready to chat!

### Tips

On iOS devices, Apple’s GPU API (Metal) is activated by default. If you experience any hiccups, try deactivating it.

#### iOS Metal

#### Auto Offload/Load

To keep the device running smoothly, PocketPal AI can automatically manage memory usage:

- Enable “Auto Offload/Load” on the model page (by default it is)
- The app will offload the model when in the background
- It’ll reload when you return (give it a few seconds for larger models)

#### Advanced Settings

Click the chevron icon to access advanced LLM settings like:

- Temperature
- BOS token
- Chat template options
- etc.

<div style="display: flex;  justify-content: center;">
    <img src="../assets/model_config_1.webp" alt="Navigate to Models Page" style="width: 33%;">
    <img src="../assets/model_config_2.webp" alt="Download a Model" style="width: 33%;">
    <img src="../assets/model_load.webp" alt="Load a Model" style="width: 33%;">
</div>

### Finally, Let’s Chat!

Once your model is loaded, head to the “Chat” page and start conversing with the loaded model!

The generation performance metric is also displayed. If interested, watch the chat bubble for real-time performance metrics: Tokens per second and Milliseconds per token.

<div style="display: flex; justify-content: center;">
    <img src="../assets/chat_1.webp" alt="Navigate to Models Page" style="width: 33%;">
    <img src="../assets/chat_2.webp" alt="Download a Model" style="width: 33%;">
</div>

### Rich Assistant Responses

Assistant responses can render Markdown headings, emphasis, lists, links, blockquotes, task lists, code blocks, and GitHub-style tables. Long code blocks, tables, and display equations scroll horizontally when needed.

LaTeX is rendered locally with KaTeX. Supported math delimiters are inline `$...$` and `\(...\)`, plus display `$$...$$` and `\[...\]`. The renderer never fetches formula resources from the network. Incomplete or unsupported formulas safely fall back to their original TeX text, which is useful while a response is still streaming.

For safety, model-provided HTML is escaped rather than executed, remote Markdown images are not loaded, and links open only after a user tap. You can turn Markdown, LaTeX, or table rendering off in Message Rendering settings at any time.

### Copying Text

Use the copy control on an assistant message to copy the full response. Message Rendering settings choose the default copy format:

- **Clean** excludes thinking blocks and model-template tokens.
- **Markdown** preserves Markdown source for sharing or editing.
- **Raw** preserves the original model output, including service tokens and thinking tags.

Code blocks, rendered tables, structured JSON/XML blocks, and math expressions also expose their own copy actions. Long-pressing selectable text remains available for paragraph-level copying where supported by the platform.

## Feedback Welcome!

If you have suggestions for new models or features, please let us know by creating an issue.

Happy exploring! 🚀📱✨
