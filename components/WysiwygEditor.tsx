import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdUndo,
  MdRedo,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
} from "react-icons/md";

type WysiwygEditorProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  className,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none min-h-[150px] border rounded-md p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 outline-none ${className || ""}`,
      },
    },
    immediatelyRender: false,
  });

  // Synchronizace vnější hodnoty (value) s editorem
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value]);

  return (
    <div>
      <div className="mb-2 flex gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={
            editor?.isActive("bold")
              ? "font-bold px-2 py-1 rounded"
              : "px-2 py-1 rounded"
          }
        >
          <MdFormatBold size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={
            editor?.isActive("italic")
              ? "italic px-2 py-1 rounded"
              : "px-2 py-1 rounded"
          }
        >
          <MdFormatItalic size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={
            editor?.isActive("underline")
              ? "underline px-2 py-1 rounded"
              : "px-2 py-1 rounded"
          }
        >
          <MdFormatUnderlined size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={
            editor?.isActive("bulletList")
              ? "px-2 py-1 rounded"
              : "px-2 py-1 rounded"
          }
        >
          <MdFormatListBulleted size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={
            editor?.isActive("orderedList")
              ? "px-2 py-1 rounded"
              : "px-2 py-1 rounded"
          }
        >
          <MdFormatListNumbered size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          className="px-2 py-1 rounded"
        >
          <MdUndo size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          className="px-2 py-1 rounded"
        >
          <MdRedo size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          className={
            editor?.isActive({ textAlign: "left" })
              ? "px-2 py-1 rounded"
              : "px-2 py-1 rounded"
          }
        >
          <MdFormatAlignLeft size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          className={
            editor?.isActive({ textAlign: "center" })
              ? "px-2 py-1 rounded"
              : "px-2 py-1 rounded"
          }
        >
          <MdFormatAlignCenter size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          className={
            editor?.isActive({ textAlign: "right" })
              ? "px-2 py-1 rounded"
              : "px-2 py-1 rounded"
          }
        >
          <MdFormatAlignRight size={24} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
          className={
            editor?.isActive({ textAlign: "justify" })
              ? "px-2 py-1 rounded"
              : "px-2 py-1 rounded"
          }
        >
          <MdFormatAlignJustify size={24} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default WysiwygEditor;
