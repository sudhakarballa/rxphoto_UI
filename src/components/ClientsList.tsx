import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ClientAddEdit from "./ClientAddEdit";
import { Client } from "../models/client";
import moment from "moment-timezone";
import { toast } from "react-toastify";
import { DeleteDialog } from "../common/deleteDialog";
import { Spinner } from "react-bootstrap";
import clientsData from "../mockData/clients.json";

const getInitials = (name: string) => {
  const words = name.replace(",", "").split(" ");
  return words
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const ClientList = () => {
  const [showClientAddEdit, setShowClientAddEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Array<Client>>(clientsData as any);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(new Client());
  const [searchText, setSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredClients = clients.filter((client) =>
    Object.values(client).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const loadData = () => {
    setIsLoading(true);
    const list = clientsData as any;
    setClients(list);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const onDeleteConfirm = () => {
    let list: Array<Client> = clientsData as any;
    list.splice(
      list.findIndex((i) => i.id === selectedItem.id),
      1
    );
    localStorage.setItem("clientsList", JSON.stringify(list));
    toast.success("Client deleted successfully");
    setShowDeleteDialog(false);
    setSelectedItem(new Client());
    loadData();
  };

  const hideDeleteDialog = () => setShowDeleteDialog(false);

  const onDeleteClick = (client: Client) => {
    setShowDeleteDialog(true);
    setSelectedItem(client);
  };

  const onEditClick = (client: Client) => {
    setShowClientAddEdit(true);
    setSelectedItem(client);
  };

  useEffect(() => {
    document.querySelector("table")?.scrollIntoView({ behavior: "smooth" });
  }, [currentPage]);

  return (
    <>
      {isLoading && (
        <div className="alignCenter">
          <Spinner />
        </div>
      )}
      <div
        className="w-100 px-4 py-3 bg-white shadow-sm"
        style={{ minHeight: "100vh" }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 gap-3">
          <h2 className="fw-bold mb-0">Active Clients</h2>

          <div
            className="input-group shadow-sm"
            style={{ maxWidth: "500px", width: "100%" }}
          >
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search clients..."
              aria-label="Search"
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div>
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm w-100"
              onClick={() => {
                setSelectedItem(new Client());
                setShowClientAddEdit(true);
              }}
            >
              Add New Client
            </button>
          </div>
        </div>

        {/* Table view for md and above */}
        <div className="d-none d-md-block card shadow-sm rounded-4 border-0">
          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th></th>
                  <th className="ps-4">Name</th>
                  <th>DOB</th>
                  <th className="d-none d-md-table-cell">Email</th>
                  <th className="d-none d-md-table-cell">Phone</th>
                  <th className="d-none d-md-table-cell">Last Visit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client, idx) => (
                  <tr key={idx} className="border-top">
                    <td className="ps-4 d-flex align-items-center gap-2">
                      {client.avatar ? (
                        <img
                          src={client.avatar}
                          className="rounded-circle border border-2"
                          alt="avatar"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-semibold"
                          style={{ width: 40, height: 40 }}
                        >
                          {getInitials(client.name)}
                        </div>
                      )}
                      <span className="fw-semibold">{client.name}</span>
                    </td>
                    <td>{client.name}</td>
                    <td>{moment(new Date(client.dateOfBirth)).format("MM/DD/YYYY")}</td>
                    <td className="d-none d-md-table-cell">{client.email}</td>
                    <td className="d-none d-md-table-cell">{client.phone}</td>
                    <td className="d-none d-md-table-cell">
                      {moment(new Date(client.lastVisit)).format("MM/DD/YYYY")}
                    </td>
                    <td>
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-circle"
                          title="Edit"
                          onClick={() => onEditClick(client)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-circle"
                          title="Delete"
                          onClick={() => onDeleteClick(client)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-3 mb-2 d-flex justify-content-end pe-3">
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    &laquo;
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li
                    key={i}
                    className={`page-item ${
                      currentPage === i + 1 ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {/* Mobile card view for below md */}
        <div className="d-md-none">
          {paginatedClients.map((client, idx) => (
            <div
              key={idx}
              className="card mb-3 shadow-sm"
              style={{ borderRadius: "1rem" }}
            >
              <div className="card-body d-flex align-items-center gap-3">
                {client.avatar ? (
                  <img
                    src={client.avatar}
                    alt="avatar"
                    width={50}
                    height={50}
                    className="rounded-circle"
                  />
                ) : (
                  <div
                    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-semibold"
                    style={{ width: 50, height: 50 }}
                  >
                    {getInitials(client.name)}
                  </div>
                )}

                <div>
                  <h5 className="card-title mb-1">{client.name}</h5>
                  {/* <p className="card-text mb-0" style={{ fontSize: "0.9rem" }}>
                    <small>
                      DOB: {moment(new Date(client.dob)).format("MM/DD/YYYY")}
                    </small>
                    <br />
                    <small>Email: {client.email}</small>
                    <br />
                    <small>Phone: {client.phone}</small>
                    <br />
                    <small>
                      Last Visit:{" "}
                      {moment(new Date(client.lastVisit)).format("MM/DD/YYYY")}
                    </small>
                  </p> */}
                </div>

                <div className="ms-auto d-flex flex-column gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => onEditClick(client)}
                    title="Edit"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => onDeleteClick(client)}
                    title="Delete"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination for mobile */}
          {totalPages > 1 && (
            <nav className="mt-3 mb-2 d-flex justify-content-center">
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    &laquo;
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li
                    key={i}
                    className={`page-item ${
                      currentPage === i + 1 ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4 px-1">
          <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-pill bg-primary p-2">
              {clients.length}
            </span>
            <span className="fw-medium">Clients</span>
          </div>
        </div>
      </div>

      {showClientAddEdit && (
        <ClientAddEdit
          onSave={loadData}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          showClientAddEdit={showClientAddEdit}
          setShowClientAddEdit={setShowClientAddEdit}
        />
      )}

      {showDeleteDialog && (
        <DeleteDialog
          itemType={"Client"}
          itemName={selectedItem["name"]}
          dialogIsOpen={showDeleteDialog}
          closeDialog={hideDeleteDialog}
          onConfirm={onDeleteConfirm}
          isPromptOnly={false}
          actionType={"Delete"}
        />
      )}
    </>
  );
};

export default ClientList;
