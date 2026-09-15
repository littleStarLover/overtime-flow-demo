<script lang="ts">
  import type { FieldDefinition, WorkflowFormValue } from '$lib/types';

  export let field: FieldDefinition;
  export let value: WorkflowFormValue | undefined;
  export let error = '';
  export let onChange: (key: string, value: WorkflowFormValue) => void;

  function handleInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    onChange(field.key, target.value);
  }

  const controlClass = 'w-full rounded-lg border border-line bg-[#fbfcfe] px-3 text-sm outline-none transition focus:border-signal';
</script>

<label class:sm:col-span-2={field.fullWidth} class="block">
  <span class="mb-2 block text-xs font-bold text-slate-600">
    {field.label}{#if field.required} <i class="text-signal">*</i>{/if}
  </span>
  {#if field.type === 'textarea'}
    <textarea
      name={field.key}
      rows="4"
      class={`${controlClass} resize-none py-3 leading-6`}
      placeholder={field.placeholder ?? ''}
      value={String(value ?? '')}
      on:input={handleInput}
    ></textarea>
  {:else if field.type === 'select'}
    <select name={field.key} class={`${controlClass} h-11`} value={String(value ?? '')} on:change={handleInput}>
      {#if !field.defaultValue}<option value="">请选择{field.label}</option>{/if}
      {#each field.options ?? [] as option}<option value={option.value}>{option.label}</option>{/each}
    </select>
  {:else}
    <input
      name={field.key}
      type={field.type}
      min={field.min}
      step={field.step}
      class={`${controlClass} h-11`}
      placeholder={field.placeholder ?? ''}
      value={String(value ?? '')}
      on:input={handleInput}
    />
  {/if}
  {#if error}<span class="mt-1.5 block text-xs text-signal">{error}</span>{/if}
</label>
