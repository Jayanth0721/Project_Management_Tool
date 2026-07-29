import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Code } from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichEditor({ value, onChange, placeholder, className = "" }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something..." }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-3 py-2 ${className}`,
      },
    },
  });

  if (!editor) return null;

  const ToolBtn = ({ onClick, active, children }: { onClick: () => void; active: boolean; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded p-1.5 text-sm transition-colors ${
        active ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-0.5 border-b border-gray-200 dark:border-gray-700 px-2 py-1.5 bg-gray-50 dark:bg-gray-750">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <span className="mx-1 w-px h-5 bg-gray-300 dark:bg-gray-600" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>
          <Heading1 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
        <span className="mx-1 w-px h-5 bg-gray-300 dark:bg-gray-600" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}>
          <Code className="h-4 w-4" />
        </ToolBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
