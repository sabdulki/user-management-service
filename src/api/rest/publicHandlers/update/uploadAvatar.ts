import { isTokenValid } from '../../../../pkg/jwt/JwtGenerator'
import { FastifyRequest, FastifyReply } from 'fastify'
import { pipeline } from 'stream/promises';
import { unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path'
import fs from 'fs'
import IStorage from 'interfaces/IStorage';
import Config from '../../../../config/Config';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const backPath = '/../../../../../public'
async function deleteFile(path: string): Promise<boolean> {
	try {
	  await unlink(path);
	  console.log('File deleted successfully');
	  return true;
	} catch (err: any) {
	  console.error('Error deleting file:', err);
	  return false;
	}
}

export async function deleteAvatar(userId: number, userAvatar: string, storage: IStorage) {
	if (!userAvatar.includes("https://lh3.googleusercontent.com/")) {
		const userAvatarFullPath = path.join(__dirname, backPath, userAvatar);
		console.log("userAvatarFullPath to be deleted: ", userAvatarFullPath)
		const isDeleted = await deleteFile(userAvatarFullPath);
		if (!isDeleted) { // delete file if it exists ????? {
			console.log("Failed to delete file");
		}
	}
	storage.deleteUserAvatar(userId);
}

export async function uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
 	const payload = await isTokenValid(request);
 	if (!payload) 
		return reply.code(401).send();

 	const userId = payload.userId;
	const storage = request.server.storage;
	let fullPathPart: string;
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
		if (Config.getInstance().getMode() === 'develop') {
			fullPathPart = backPath;
		}
		else {
			fullPathPart = '/../../../../../public';
		}
		const fullPath = path.join(__dirname, fullPathPart, relativePath);
		console.log("path for image: ", fullPath);
		fs.mkdirSync(path.dirname(fullPath), { recursive: true });
		try {
			const writeStream = fs.createWriteStream(fullPath);
			await pipeline(fileStream, writeStream);
		  } catch (err: any) {
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
 	
	if (userAvatar && !userAvatar.includes("https://lh3.googleusercontent.com/")) {
		await deleteAvatar(userId, userAvatar, storage);
	}

	try {
		console.log("here!!!!");
		storage.addUserAvatar(userId, relativePath);
	} catch (error: any) {
		return reply.code(500).send({ message: 'Failed to record avatar in storage' });
	}
 	return reply.code(200).send({ avatar: `${relativePath}` });
}
