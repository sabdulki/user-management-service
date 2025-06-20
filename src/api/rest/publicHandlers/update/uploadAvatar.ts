import { isTokenValid } from '../../../../pkg/jwt/JwtGenerator'
import { FastifyRequest, FastifyReply } from 'fastify'
import { pipeline } from 'stream/promises';
import { unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path'
import fs from 'fs'
import util from 'util'
import IStorage from 'interfaces/IStorage';
import Config from '../../../../config/Config';

const backPath = '/../../../../../public'
export const DEFAULT_AVATAR = 'avatars/default.png'
// export const UPLOAD_DIR = backPath + '/avatars'
export const UPLOAD_DIR = path.join(__dirname, backPath, "/avatars/");
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const pump = util.promisify(pipeline)


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
	console.log(">>> uploadAvatar handler was called");

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
	// ---------

	// console.log("Headers:", request.headers);
	// console.log("Is multipart?", request.isMultipart());

	let file;
	try {
	  file = await request.file(); // ✅ Automatically throws 413 if file too big
	} catch (err: any) {
	  if (err.code === 'FST_REQ_FILE_TOO_LARGE') {
		return reply.code(413).send({ message: 'File too large (max 2MB)' });
	  }
	  return reply.code(400).send({ message: 'Invalid file upload' });
	}
  
	if (!file || !ALLOWED_TYPES.includes(file.mimetype)) {
	  return reply.code(400).send({ message: 'Unsupported or missing file' });
	}
  
	const filename = `${randomUUID()}-${payload.userId}-${file.filename}`;
	const fullPath = path.join(UPLOAD_DIR, filename);
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  
	try {
	  await pipeline(file.file, fs.createWriteStream(fullPath));
	} catch (err) {
	  return reply.code(500).send({ message: 'Failed to save file' });
	}
  
	return reply.code(201).send({ message: 'Upload successful' });

	
	// --------
	// const parts = request.parts();
	// let fileSaved = false;

	// fs.mkdirSync(UPLOAD_DIR, { recursive: true });
	
	// for await (const part of parts) {
	// 	if (part.type === 'file') {
	// 		if (!ALLOWED_TYPES.includes(part.mimetype)) {
	// 			return reply.code(400).send({ message: 'Unsupported file type' });
	// 		}

	// 		if (part.file.truncated) {
	// 			return reply.code(413).send({ message: 'File too large' });
	// 		}

	// 		const safeFilename = `${randomUUID()}-${path.basename(part.filename)}`;
	// 		const fullPath = path.join(UPLOAD_DIR, safeFilename);

	// 		try {
	// 			await pipeline(part.file, fs.createWriteStream(fullPath));
	// 			fileSaved = true;
	// 		} catch (err) {
	// 			console.error(err);
	// 			return reply.code(500).send({ message: 'File save failed' });
	// 		}
	// 	} else {
	// 		// Optional: you might still want to check non-file fields
	// 		console.log("Received non-file form part");
	// 	}
	// }

	// if (!fileSaved) {
	// 	return reply.code(400).send({ message: 'No file uploaded' });
	// }
	// return reply.code(201).send({ message: 'Upload successful' });




	// --------- WORKING VERSION
 	// const parts = request.parts();
	// console.log("here");
	// // 413 will be automatically send if the file is bigger than 2 mb
	
	// let originalFilename: string | undefined;
	// let fileStream: NodeJS.ReadableStream | undefined;
	// let relativePath: string | undefined;
	
	// for await (const part of parts) {
 	//   if ('file' in part && typeof part.file === 'object' && part.type === 'file') {
	// 	if (!ALLOWED_TYPES.includes(part.mimetype)) {
	// 		return reply.code(400).send({ message: 'Unsupported file type' });
	// 	}

	// 	if (part.file.truncated) {
	// 		console.log("caught!");
	// 		return reply.code(413).send({ message: 'File too large' });
	// 	}

 	//     originalFilename = part.filename;
 	//     fileStream = part.file;
		
	// 	if (!originalFilename || !fileStream) {
	// 		return reply.code(400).send({ message: 'File not found in form data' });
	// 	}
	// 	const filename = `${randomUUID()}-${userId}-${originalFilename}`;
	// 	relativePath = `avatars/${filename}`;
	// 	if (Config.getInstance().getMode() === 'develop') {
	// 		fullPathPart = backPath;
	// 	}
	// 	else {
	// 		fullPathPart = '/../../../../../public';
	// 	}
	// 	const fullPath = path.join(__dirname, fullPathPart, relativePath);
	// 	// console.log("path for image: ", fullPath);
	// 	// fs.mkdirSync(path.dirname(fullPath), { recursive: true });
	// 	try {
	// 		const writeStream = fs.createWriteStream(fullPath);
	// 		await pipeline(fileStream, writeStream);
	// 	  } catch (err: any) {
	// 		// console.error('Error saving file:', err);
	// 		return reply.code(500).send({ message: 'Failed to save file' });
	// 	  }
 	//   } else {
 	//     // console.log('Expected a file part but got a field.');
 	//     return reply.code(400).send({ message: 'No file provided' });
 	//   }
 	// }

 	// ------------
	// const file = await request.file(); // throws 413 if too big automatically

	//  if (!file) {
	//    return reply.code(400).send({ message: 'No file provided' });
	//  }
   
	//  if (!ALLOWED_TYPES.includes(file.mimetype)) {
	//    return reply.code(400).send({ message: 'Unsupported file type' });
	//  }
   
	//  const filename = `${randomUUID()}-${payload.userId}-${file.filename}`;
	//  const relativePath = `avatars/${filename}`;
	//  const fullPath = path.join(__dirname, '/../../public', relativePath);
	//  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
   
	//  try {
	//    await pipeline(file.file, fs.createWriteStream(fullPath));
	//  } catch (err) {
	//    return reply.code(500).send({ message: 'Failed to save file' });
	//  }
	// --------
	// if (!relativePath) {
	// 	return reply.code(400).send({ message: 'No file uploaded' });
	// }
 	// console.log("userAvatar: ", userAvatar, "DEFAULT_AVATAR: ", DEFAULT_AVATAR);
	// if (userAvatar && !userAvatar.includes("https://lh3.googleusercontent.com/") && userAvatar !== DEFAULT_AVATAR) {
	// 	await deleteAvatar(userId, userAvatar, storage);
	// }

	// try {
	// 	console.log("here!!!!");
	// 	storage.addUserAvatar(userId, relativePath);
	// } catch (error: any) {
	// 	return reply.code(500).send({ message: 'Failed to record avatar in storage' });
	// }
	// return reply.code(200).send({ avatar: `${relativePath}` });
 	// return reply.code(200).send({ "fullPath": `${fullPath}` });
}
