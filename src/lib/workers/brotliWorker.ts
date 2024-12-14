import brotliPromise from 'brotli-wasm';

function base64Encode(arrayBuffer: ArrayBufferLike) {
	return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

function base64Decode(base64String: string) {
	const binaryString = atob(base64String);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

onmessage = async (event) => {
	const { type, payload } = event.data;

	const brotli = await brotliPromise;

	if (type === 'compress') {
		const encoder = new TextEncoder();
		const input = encoder.encode(payload);

		const compressed = brotli.compress(input);
		const compressedBase64 = base64Encode(compressed.buffer);

		self.postMessage({ type: 'compressed', payload: compressedBase64 });
	} else if (type === 'decompress') {
		const compressedData = base64Decode(payload);
		console.log(payload, compressedData);
		const decompressed = brotli.decompress(compressedData);
		const decoder = new TextDecoder();
		const originalText = decoder.decode(decompressed);

		self.postMessage({ type: 'decompressed', payload: originalText });
	} else {
		self.postMessage({ type: 'error', payload: 'Unknown operation' });
	}
};

export {};
