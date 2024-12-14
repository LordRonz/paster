export enum BrotliWorkerMessageType {
	COMPRESS = 'compress',
	DECOMPRESS = 'decompress',
	COMPRESSED = 'compressed',
	DECOMPRESSED = 'decompressed'
}

export type BrotliWorkerMessage = {
    type: BrotliWorkerMessageType,
    payload: string;
}