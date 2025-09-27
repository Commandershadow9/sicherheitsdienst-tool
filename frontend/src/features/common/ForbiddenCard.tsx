export function ForbiddenCard() {
  return (
    <div className="border rounded p-4 bg-card" role="alert">
      <div className="text-lg font-semibold mb-1">403 – Zugriff verweigert</div>
      <p className="text-sm text-muted-foreground">
        Du hast keinen Zugriff auf diese Inhalte. Bitte wende dich an einen Administrator, wenn du Berechtigungen benötigst.
      </p>
    </div>
  )
}

export default ForbiddenCard
