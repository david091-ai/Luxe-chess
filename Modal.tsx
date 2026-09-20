export function Modal({children,onClose}: {children:React.ReactNode;onClose?:()=>void}) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <div className="glass max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl p-6" onMouseDown={e=>e.stopPropagation()}>{children}</div>
  </div>;
}
