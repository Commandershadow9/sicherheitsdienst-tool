export function ForbiddenCard() {
  return (
    <div className="border rounded p-4 bg-card">
      <div className="text-lg font-semibold mb-1">403 – Zugriff verweigert</div>
      <p className="text-sm text-muted-foreground">
        Du hast keine Berechtigung, diese Inhalte anzuzeigen. Bitte wende dich an einen Administrator, wenn du Zugriff benötigst.
      </p>
    </div>
  )
}

export default ForbiddenCard

