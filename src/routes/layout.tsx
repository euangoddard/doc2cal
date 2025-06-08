import { component$, Slot } from "@builder.io/qwik";

export default component$(() => {
  return (
    <>
      <main class="mx-auto h-full w-full max-w-screen-lg px-4">
        <Slot />
      </main>
    </>
  );
});
