import DemoDataSeeder from "@/lib/demo-data-seeder"

export default function AdminPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Existing admin cards... (replace with actual admin controls) */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Card 1</h2>
          <p>Content for card 1.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Card 2</h2>
          <p>Content for card 2.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Card 3</h2>
          <p>Content for card 3.</p>
        </div>

        <DemoDataSeeder />
      </div>
    </div>
  )
}
