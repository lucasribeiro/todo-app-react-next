import TodoApp from "@/components/todo-app";

export default function Home() {
  return (
    <>
      <header className="bg-slate-700 py-3 text-center text-white">
        <h1 className="m-0 text-2xl font-bold">Welcome to My App - GitHub Actions</h1>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-4/5 py-8">
          <TodoApp />
        </div>
      </main>

      <footer className="bg-slate-700 py-3 text-center text-white">
        <p className="m-0">My HTML App &copy; 2026</p>
      </footer>
    </>
  );
}
