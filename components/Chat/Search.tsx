import { NDKUserProfile } from "@nostr-dev-kit/ndk";
import { Event } from "nostr-tools";
import { Fragment, useState } from "react";

export default function Search({
  userProfiles,
}: {
  userProfiles: Record<string, NDKUserProfile>;
}) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const decryptedDirectMessages: Event[] = [];
  // const { search, decryptedDirectMessages } = useSearch();

  const handleInputClick = () => {
    setIsOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
    setSearchQuery("");
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    // // TODO: Implement nostr search logic here
  };

  return (
    <Fragment>
      <div className="flex-1 mx-4 relative">
        <input
          type="text"
          placeholder="Search chats..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleInputClick}
          readOnly
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {isOverlayOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center">
            <button onClick={handleCloseOverlay} className="mr-4 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <input
              type="text"
              autoFocus
              placeholder="Search on nostr..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {/* {searchQuery ? (
              <div className="text-gray-600">
                Search results will appear here...
              </div>
            ) : (
              <div className="text-gray-400 text-center mt-10">
                Type to search on nostr
              </div>
            )} */}
            {searchQuery ? (
              <div className="text-xs text-black/40 w-full text-center">
                Total results: {decryptedDirectMessages.length}
              </div>
            ) : (
              <div className="text-gray-400 text-center mt-10">
                Type to search on nostrsss
              </div>
            )}
            {decryptedDirectMessages && decryptedDirectMessages.length > 0 ? (
              <div className="space-y-4 mt-4">
                {decryptedDirectMessages.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="font-medium text-gray-800 mb-1">
                      {userProfiles[event.pubkey]?.displayName ||
                        "Unknown User"}
                    </div>
                    <div className="text-black/40">
                      {event.content ? (
                        <span>
                          {(() => {
                            // Trim content to max 45 chars
                            let content = event.content;
                            // const searchRegex = new RegExp(searchQuery, "i");
                            const searchIndex = content
                              .toLowerCase()
                              .indexOf(searchQuery.toLowerCase());

                            // If content is too long, create a trimmed version that includes the search term
                            if (content.length > 45) {
                              // If search term is found, center the trimmed content around it
                              if (searchIndex >= 0) {
                                const startPos = Math.max(0, searchIndex - 15);
                                const endPos = Math.min(
                                  content.length,
                                  searchIndex + searchQuery.length + 15
                                );
                                content =
                                  (startPos > 0 ? "..." : "") +
                                  content.substring(startPos, endPos) +
                                  (endPos < content.length ? "..." : "");
                              } else {
                                // If search term not found, just take first 42 chars
                                content = content.substring(0, 42) + "...";
                              }
                            }

                            // Highlight the search term
                            return content
                              .split(new RegExp(`(${searchQuery})`, "gi"))
                              .map((part, i) =>
                                part.toLowerCase() ===
                                searchQuery.toLowerCase() ? (
                                  <strong key={i} className="text-black">
                                    {part}
                                  </strong>
                                ) : (
                                  part
                                )
                              );
                          })()}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-gray-500 text-center mt-8">
                No results found for &quot;{searchQuery}&quot;
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Fragment>
  );
}
