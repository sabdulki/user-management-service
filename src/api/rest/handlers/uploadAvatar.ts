import { FastifyRequest, FastifyReply } from 'fastify'
import { isTokenValid } from '../../../pkg/jwt/JwtGenerator'
import { createWriteStream } from 'fs'
import fastifyMultipart from '@fastify/multipart'
import { Readable } from 'stream'
import path from 'path'
import { unlink } from 'fs'
import fs from 'fs'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB or 2,097,152
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']


export function saveImageFile(fileStream: Readable, fullPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = createWriteStream(fullPath);
      let totalSize = 0;
      let aborted = false;
      let hasResolvedOrRejected = false;
  
      function safeReject(err: Error) {
        if (!hasResolvedOrRejected) {
          hasResolvedOrRejected = true;
          return reject(err);
        }
      }
  
      function safeResolve() {
        if (!hasResolvedOrRejected) {
          hasResolvedOrRejected = true;
          return resolve();
        }
      }
  
      fileStream.on('data', (chunk) => {
        totalSize += chunk.length;
        if (totalSize > MAX_FILE_SIZE && !aborted) {
          aborted = true;
          fileStream.pause();
          stream.destroy();
          fileStream.destroy();
          fs.unlink(fullPath, () => {});
          safeReject(new Error('File too large'));
        }
      });
  
      stream.on('finish', () => {
        if (!aborted) {
          safeResolve();
        }
      });
  
      stream.on('error', safeReject);
      fileStream.on('error', safeReject);
  
      fileStream.pipe(stream);
    });
  }
  

export async function uploadAvatar(request: FastifyRequest, reply: FastifyReply) 
{
    const payload = await isTokenValid(request);
    if (!payload)
        return reply.code(401).send();
    const userId = payload.userId;
    
    const data = await request.file()   // reads the file from the multipart body

    if (!data || !ALLOWED_TYPES.includes(data.mimetype)) {
        return reply.code(400).send({ error: 'Invalid image file' })
    }

    // Get original file name
    const originalFilename = data.filename

    // Choose a new unique name (like timestamp or UUID)
    const filename = `${Date.now()}-${originalFilename}`
    const relativePath = `avatars/${filename}`
    const fullPath = path.join(__dirname, '../../../public', relativePath)

    // Ensure directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })

    // try {
    //     await saveImageFile(data.file, fullPath)
    //   } catch (err: any) {
    //     return reply.code(413).send({ error: 'File too large (max 2MB)' })
    //   }

      try {
        await saveImageFile(data.file, fullPath)
        return reply.send({ success: true })
      } catch (err: any) {
        if (err.message === 'File too large') {
          return reply.code(413).send({ error: 'File too large (max 2MB)' })
        }
        return reply.code(500).send({ error: 'Failed to upload file' })
      }
    // Save the file to disk
    // const uploadResult  = await new Promise((resolve, reject) => {
    //     const stream = createWriteStream(fullPath) // opens a writable stream to the location
    //     let totalSize = 0;
    //     let aborted = false;
    
    //     // MUST attach before pipe
    //     data.file.on('data', (chunk) => {
    //         totalSize += chunk.length;
    //         console.log("size: ", totalSize);
    //         if (totalSize > MAX_FILE_SIZE && !aborted) {
    //             console.log("size too large! : ", totalSize);
    //             aborted = true;
    //             stream.destroy(); // stop writing
    //             data.file.destroy(); // stop reading
    //             fs.unlink(fullPath, () => {}); // delete file async
    //             reject(new Error('File too large'));
    //         }
    //     });
    
    //     stream.on('finish', () => {
    //         if (!aborted) resolve(null);
    //         console.log("success! ");
    //     });
    //     stream.on('error', (err) => reject(err));
    //     data.file.on('error', (err) => reject(err));
    
    //     data.file.pipe(stream);
    // }).catch(() => {
    //     reply.code(413).send({ error: 'File too large (max 2MB)' });
    //     return false; // signal failure
    // });
    // if (!uploadResult) return; 

    // Save the relative path in your DB for the user
    try {
        request.server.storage.addUserAvatar(userId, relativePath);
    } catch (error: any) {
        return reply.code(500).send()
    }
    return reply.code(200).send({ avatarUrl: `/uploads/${relativePath}` });
    // return reply.send({ avatarUrl: `/uploads/${relativePath}` })
}