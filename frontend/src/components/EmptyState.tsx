interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = "📦", title, description, action }: Props) {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
      <div className="text-5xl mb-4 select-none">{icon}</div>
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
