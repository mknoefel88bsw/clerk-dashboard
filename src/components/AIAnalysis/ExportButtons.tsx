interface Props {
  markdown: string;
}

export function ExportButtons({ markdown }: Props) {
  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clerk-ki-empfehlungen-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printPage = () => window.print();

  return (
    <div className="flex gap-2 no-print">
      <button
        onClick={downloadMarkdown}
        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded"
      >
        Als Markdown herunterladen
      </button>
      <button
        onClick={printPage}
        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded"
      >
        Drucken / PDF
      </button>
    </div>
  );
}
