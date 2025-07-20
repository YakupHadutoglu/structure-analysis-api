import { zipParser } from './zipParser.service';

export const analyze = async (file: File) => {

    let result: any;

       if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
           try {
            result = await zipParser(file);
            console.log("The given file was sent to the zip solution")
        } catch (error) {

        }
    }

}
