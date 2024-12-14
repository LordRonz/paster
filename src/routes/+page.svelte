<script lang="ts">
	import cn from '$lib/cn';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let text = '';
	let compressedText = '';
	let url = '';

	let brotliWorker: Worker;

	onMount(() => {
		(async () => {
			const BrotliWorker = await import('$lib/workers/brotliWorker?worker');
			brotliWorker = new BrotliWorker.default();

			brotliWorker.onmessage = (event) => {
				const { type, payload } = event.data;

				if (type === 'compressed') {
					compressedText = payload;
					url = 'https://' + location.host + location.pathname + '#' + compressedText;
				} else if (type === 'decompressed') {
					text = payload;
				} else {
					console.error('Worker error:', payload);
				}
			};

			const initialContent = location.hash.substring(1);
			if (!initialContent) return;
			decompress(initialContent);
		})();

		return () => {
			brotliWorker.terminate();
		};
	});

	function compress() {
		brotliWorker.postMessage({ type: 'compress', payload: text });
	}

	function decompress(text?: string) {
		brotliWorker.postMessage({ type: 'decompress', payload: text ?? compressedText });
	}

	async function copy() {
		await navigator.clipboard.writeText(url);
		toast.success('Copied!');
	}

	function cancelOffer() {
		compressedText = '';
		url = '';
	}
</script>

<div class="flex h-screen flex-col">
	<!-- Textarea wrapper -->
	<div class="flex-grow">
		<textarea
			id="plaintext"
			spellcheck="false"
			class="h-full w-full resize-none bg-black p-2 font-mono text-gray-200 caret-pink-500"
			bind:value={text}
		></textarea>
	</div>

	<!-- Navigation bar -->
	<div id="nav" class="flex h-8 items-center justify-between bg-gray-800 px-2 text-sm text-white">
		<div class={cn('space-x-2', compressedText ? 'hidden' : 'flex')}>
			<a
				class="cursor-pointer px-2 py-1 hover:bg-gray-600"
				href="https://github.com/lordronz/paster"
				>[github]
			</a>
		</div>

		<div class={cn('space-x-2', compressedText ? 'hidden' : 'flex')}>
			<button class="cursor-pointer px-2 py-1 hover:bg-gray-600" onclick={compress}
				>[generate url]
			</button>
			<button class="cursor-pointer px-2 py-1 hover:bg-gray-600">[generate markdown link]</button>
		</div>

		<div
			id="text-offer"
			class={cn('w-full items-center space-x-2', compressedText ? 'flex' : 'hidden')}
		>
			<input
				class="flex-grow border border-gray-500 bg-transparent px-2 py-1"
				defaultValue={url}
				disabled
			/>
			<button class="cursor-pointer px-2 py-1 hover:bg-gray-600" onclick={copy}>[copy]</button>
			<button class="cursor-pointer px-2 py-1 hover:bg-gray-600" onclick={cancelOffer}
				>[cancel]</button
			>
		</div>
	</div>
</div>
