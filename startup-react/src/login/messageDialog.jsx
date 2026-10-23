import React from 'react';
import { useNavigate } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

export function MessageDialog(props) {
  const navigate = useNavigate();

  return (
    <Modal {...props} show={props.message} centered>
      <Modal.Body>{props.message}</Modal.Body>
      <Modal.Footer>
        <Button onClick ={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}