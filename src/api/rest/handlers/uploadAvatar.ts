import { isTokenValid } from '../../../pkg/jwt/JwtGenerator'
import { FastifyRequest, FastifyReply } from 'fastify'
import { pipeline } from 'stream/promises';
import { unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path'
import fs from 'fs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

async function deleteFile(path: string): Promise<boolean> {
	try {
	  await unlink(path);
	  console.log('File deleted successfully');
	  return true;
	} catch (err) {
	  console.error('Error deleting file:', err);
	  return false;
	}
  }

export async function uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
 	const payload = await isTokenValid(request);
 	if (!payload) 
		return reply.code(401).send();

 	const userId = payload.userId;
	const storage =  request.server.storage;
	let userAvatar: string | undefined;
	try {
		userAvatar = storage.getUserAvatar(userId);
	} catch (err: any) {
		console.log(err);
		return reply.code(401).send();
	}

 	const parts = request.parts();
	// 413 will be automatically send if the file is bigger than 2 mb

 	let originalFilename: string | undefined;
 	let fileStream: NodeJS.ReadableStream | undefined;
	let relativePath: string | undefined;
 	for await (const part of parts) {
 	  if ('file' in part && typeof part.file === 'object') {
		if (!ALLOWED_TYPES.includes(part.mimetype)) {
			return reply.code(400).send({ message: 'Unsupported file type' });
		  }
 	    originalFilename = part.filename;
 	    fileStream = part.file;
		
		if (!originalFilename || !fileStream) {
			return reply.code(400).send({ message: 'File not found in form data' });
		}
		const filename = `${randomUUID()}-${userId}-${originalFilename}`;
		relativePath = `avatars/${filename}`;
		const fullPath = path.join(__dirname, '../../../public', relativePath);
		fs.mkdirSync(path.dirname(fullPath), { recursive: true });
		try {
			const writeStream = fs.createWriteStream(fullPath);
			await pipeline(fileStream, writeStream);
		  } catch (err) {
			console.error('Error saving file:', err);
			return reply.code(500).send({ message: 'Failed to save file' });
		  }
 	  } else {
 	    console.log('Expected a file part but got a field.');
 	    return reply.code(400).send({ message: 'No file provided' });
 	  }
 	}

	if (!relativePath) {
		return reply.code(400).send({ message: 'No file uploaded' });
	}
 	
	if (userAvatar) {
		const userAvatarFullPath = path.join(__dirname, '../../../public', userAvatar);

		const isDeleted = await deleteFile(userAvatarFullPath);
		if (!isDeleted)
			storage.deleteUserAvatar(userId);
	}
	try {
		storage.addUserAvatar(userId, relativePath);
	} catch (error: any) {
	return reply.code(500).send({ message: 'Failed to record avatar in storage' });
	}
 	return reply.code(200).send({ avatar: `${relativePath}` });
}
