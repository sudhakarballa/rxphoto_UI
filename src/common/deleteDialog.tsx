
import { Button, Modal } from "react-bootstrap"

type Props = {
    itemType?: string;
    itemName: string;
    dialogIsOpen: any;
    closeDialog: any;
    onConfirm: any;
    customDeleteMessage?: any;
    isPromptOnly: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    actionType: any;
    hideCrossButton?: any;
    customHeader?:any;
};

export const DeleteDialog: React.FC<Props> = (props) => {
    

    const { customHeader, itemType, itemName, dialogIsOpen, closeDialog, onConfirm, customDeleteMessage, isPromptOnly, confirmLabel, cancelLabel, actionType, hideCrossButton } = props;

    const getDeleteMessage = () => {

        return customDeleteMessage ? customDeleteMessage : <div>Do you want to delete <strong>{itemName}</strong> {itemType}?</div>;
    }
    return (
        <div>
            <Modal show={dialogIsOpen}
                onHide={closeDialog}
                animation={false}
                backdrop="static" 
                keyboard={false} // this is added to disable click outside of Modal window
                centered >
                {!hideCrossButton ? <Modal.Header closeButton >
                    <Modal.Title id="deleteDialogHeader">{customHeader ?? actionType  + ' ' + itemType}</Modal.Title>
                </Modal.Header>
                    : <Modal.Header >
                        <Modal.Title id="deleteDialogHeader">{customHeader ?? actionType  + ' ' + itemType}</Modal.Title>
                    </Modal.Header>
                }
                <Modal.Body id="deleteModelBody">{getDeleteMessage()} </Modal.Body>
                <Modal.Footer>
                    <div hidden={isPromptOnly}>
                        <Button variant={'danger'} id="deletebtn_forDeleteconfirmation" onClick={() => onConfirm()}>
                            {confirmLabel ? confirmLabel : 'Delete'}
                        </Button>&nbsp;&nbsp;
                        <Button hidden={cancelLabel == ""} variant="secondary" id="cancelbtn_forDeleteconfirmation" onClick={closeDialog}>
                            {cancelLabel ? cancelLabel : 'Cancel'}
                        </Button>
                    </div>
                    <div hidden={!isPromptOnly}>
                        <Button hidden={cancelLabel == ""} variant="primary" id="closebtn_forDeleteconfirmation" onClick={closeDialog}>
                            Close
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>

    )
}