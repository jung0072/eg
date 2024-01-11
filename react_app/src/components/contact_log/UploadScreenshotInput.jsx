import React, { useContext, useEffect, useState } from 'react';
import { Image, message, Modal, Upload } from "antd";
import { Constants, getBase64, getTimeStringFromDate } from "../utils";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { WebPageInfoContext } from "../../providers/WebPageInfoContextProvider";

export const imageFileTypes = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'png', 'eps'];
export const UploadScreenshotInput = ({ setImageURL }) => {
    // state variable to hold the image file list
    const [imageFileList, setImageFileList] = useState([]);
    const [loading, setLoading] = useState(false);
    const { webPageInfo, updateWebPageInfo } = useContext(WebPageInfoContext);
    // state variables to track which image is being previewed
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    // useEffect hook to set the image URL if we already have one
    useEffect(() => {
        if (webPageInfo.screenshot && webPageInfo.route) {
            // First find the current screen based on the pathname of the last accessed page and the Screens constant
            const currentScreen = Constants.SCREENS.find(screen => webPageInfo.route.match(screen.route));
            if (currentScreen) {
                setImageFileList([
                    {
                        uid: '-1',
                        name: `screenshot_${currentScreen.value.toLocaleLowerCase}_${getTimeStringFromDate()}.png`,
                        status: 'done',
                        url: webPageInfo.screenshot,
                    },
                ]);
                setImageURL(webPageInfo.screenshot);
            }
        }
    }, [webPageInfo, setImageURL]);

    // callback function to handle image preview click and set the preview image
    const handlePreview = async (file) => {
        if (file.url) {
            setPreviewImage(file.url);
            setPreviewVisible(true);
        }
    };

    const imageUploadButton = (
        <div>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Upload</div>
        </div>
    );

    const uploadImageProps = {
        name: 'input-image-attachment',
        listType: "picture-card",
        className: 'upload-image-container',
        maxCount: 1,
        accept: imageFileTypes.map(type => `.${type}`).toString(),
        fileList: imageFileList,
        beforeUpload: (file) => {
            // check if the file type that was uploaded was an image and if it was not return the ignore event
            const isImageFile = imageFileTypes.map(ext => `image/${ext}`).includes(file.type);
            if (!isImageFile) {
                message.error(`${file.name} is not an image file`);
            }

            // The image must be under 2MB
            const imageFileSizeLimit = file.size / 1024 / 1024 < 2;
            if (!imageFileSizeLimit) {
                message.error(`${file.name} must be smaller then 2MB`);
            }
            return (isImageFile && imageFileSizeLimit) || Upload.LIST_IGNORE;
        },
        onChange: ({ file, fileList }) => {
            // set the image url
            // from ant-d docs about controlling state for the file list
            let newFileList = fileList;
            newFileList = newFileList.map(file => {
                if (file.response) {
                    const updated_file = file;
                    updated_file.url = file.response.url;
                    updated_file.status = "done";
                    updated_file.name = file.name;
                    return updated_file;
                }
                return file;
            });
            setImageFileList(newFileList);
            // initially started from the ant-d upload documentation
            if (file.status === 'done') {
                // get the base64 url from the image and set the loading/ image states
                setLoading(false);
                getBase64(file.originFileObj, (url) => {
                    setImageURL(url);
                });
            } else if (file.status === 'uploading') {
                setLoading(true);
            }
        },
        onRemove: () => {
            setImageURL(null);
            setImageFileList([]);
        },
        onPreview: handlePreview,
        customRequest: ({ onSuccess }) => setTimeout(() => onSuccess('ok'), 50),
    };

    return (
        <>
            <Upload {...uploadImageProps}>
                {imageUploadButton}
            </Upload>
            <Modal
                open={previewVisible}
                title="Screenshot Preview"
                footer={null}
                onCancel={() => setPreviewVisible(false)}
                width={1200}
            >
                <Image
                    preview={false}
                    src={previewImage}
                    alt={"The image that will be uploaded for the IT Support Issue"}
                    style={{ width: '100%' }}
                />
            </Modal>
        </>
    );
};
