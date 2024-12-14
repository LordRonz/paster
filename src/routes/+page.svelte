<script lang="ts">
	import cn from '$lib/cn';
	import { BrotliWorkerMessageType, type BrotliWorkerMessage } from '$lib/workers/type';
	import { onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { CompressedOutputType } from './type';

	let text = '';
	let compressedText = '';
	let url = '';
	let outputType: CompressedOutputType = CompressedOutputType.URL;

	let brotliWorker: Worker;

	onMount(() => {
		(async () => {
			const BrotliWorker = await import('$lib/workers/brotliWorker?worker');
			brotliWorker = new BrotliWorker.default();

			brotliWorker.onmessage = (event: MessageEvent<BrotliWorkerMessage>) => {
				const { type, payload } = event.data;

				if (type === BrotliWorkerMessageType.COMPRESSED) {
					compressedText = payload;
					const rawResult = `https://${location.host}${location.pathname}#${compressedText}`;
					switch (outputType) {
						case CompressedOutputType.URL:
							url = rawResult;
							break;
						case CompressedOutputType.MD:
							url = `[paste](${rawResult})`;
							break;
					}
				} else if (type === BrotliWorkerMessageType.DECOMPRESSED) {
					text = payload;
				} else {
					console.error('Worker error:', payload);
				}
			};

			decompressInitialContent();
		})();

		return () => {
			brotliWorker?.terminate();
		};
	});

	onDestroy(() => {
		brotliWorker?.terminate();
	});

	function decompressInitialContent() {
		const initialContent = location.hash.substring(1);
		if (!initialContent) return;
		decompress(initialContent);
	}

	function compress(type = CompressedOutputType.URL) {
		outputType = type;
		brotliWorker?.postMessage({ type: BrotliWorkerMessageType.COMPRESS, payload: text });
	}

	function decompress(text?: string) {
		brotliWorker?.postMessage({
			type: BrotliWorkerMessageType.DECOMPRESS,
			payload: text ?? compressedText
		});
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

<svelte:window on:hashchange={decompressInitialContent} />
<div class="flex h-screen flex-col bg-gray-900">
	<!-- Textarea wrapper -->
	<div class="flex-grow">
		<textarea
			id="plaintext"
			spellcheck="false"
			class="h-full w-full resize-none rounded-lg border border-gray-700 bg-gray-900 p-4 font-mono text-gray-100 placeholder-gray-500 caret-pink-500 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
			bind:value={text}
			placeholder="Start typing here..."
		></textarea>
	</div>

	<!-- Navigation bar -->
	<div id="nav" class="flex h-8 items-center justify-between bg-gray-800 px-2 text-sm text-white">
		<div class={cn('space-x-2', compressedText ? 'hidden' : 'flex')}>
			<a
				class="cursor-pointer px-2 py-1 hover:bg-gray-600"
				href="https://github.com/lordronz/paster"
			>
				[github]
			</a>
		</div>

		<div class={cn('space-x-2', compressedText ? 'hidden' : 'flex')}>
			<button class="cursor-pointer px-2 py-1 hover:bg-gray-600" onclick={() => compress()}>
				[generate url]
			</button>
			<button
				class="cursor-pointer px-2 py-1 hover:bg-gray-600"
				onclick={() => compress(CompressedOutputType.MD)}
			>
				[generate markdown link]
			</button>
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
			<button class="cursor-pointer px-2 py-1 hover:bg-gray-600" onclick={cancelOffer}>
				[cancel]
			</button>
		</div>
	</div>
</div>
