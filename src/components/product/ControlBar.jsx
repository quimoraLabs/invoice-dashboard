import { HiSearch, HiX } from "react-icons/hi";
import CustomDropdown from "../CustomDropdown";

export default function ControlBar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  categories,
  sortOrder,
  setSortOrder,
}) {
  
  const categoryOptions = categories.map((cat) => ({
    value: cat,
    label: cat === "all" ? "All Categories" : cat,
  }));

  const sortOptions = [
    { value: "name-asc", label: "Name: A-Z" },
    { value: "name-desc", label: "Name: Z-A" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ];

  // Bug Fix 2 & 3: Master condition to see if any user mutations have altered state defaults
  const isFiltered = searchQuery !== "" || categoryFilter !== "all" || sortOrder !== "name-asc";

  const handleResetAll = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSortOrder("name-asc");
  };

  return (
    <div className="mb-8 grid grid-cols-1 md:flex md:items-center gap-4">
      {/* Search Bar Wrapper Container */}
      <div className="relative flex-grow md:max-w-md">
        <HiSearch
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface-elevated py-2.5 pl-11 pr-10 text-sm text-foreground transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        
        {/* Bug Fix 4: Smooth interactive absolute click action clear mechanism on string data triggers */}
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
          >
            <HiX size={16} />
          </button>
        )}
      </div>

      {/* Filters Group */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Category Selection Dropdown */}
        <CustomDropdown
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
        />

        {/* Sorting Execution Dropdown */}
        <CustomDropdown
          labelPrefix="Sort:"
          value={sortOrder}
          onChange={setSortOrder}
          options={sortOptions}
        />

        {/* Bug Fix 2 & 3: Master Reset Action Pill UI Component injection */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleResetAll}
            className="text-sm font-semibold text-danger hover:opacity-80 transition-colors px-2 py-1.5 focus:outline-none"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}